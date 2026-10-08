import { httpError } from '../../middleware/errorHandler.js';
import { toPublicUser } from '../../utils/dto.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAccessToken, generateRefreshToken, hashToken } from './tokens.js';
import { requestOtp, consumeOtp } from './otp.js';
import { recordAudit } from '../audit/writer.js';
import { track } from '../analytics/events.js';
import { refreshOnboardingState } from '../users/service.js';

const REFRESH_TTL_DAYS = 30;

function normalizeChannel(input) {
  if (input.email) return { email: input.email.trim().toLowerCase(), phone_e164: input.phone_e164 ?? null };
  if (input.phone_e164) return { email: null, phone_e164: input.phone_e164.trim() };
  const id = (input.identifier ?? '').trim();
  return id.includes('@') ? { email: id.toLowerCase(), phone_e164: null } : { email: null, phone_e164: id || null };
}

async function findByChannel(db, { email, phone_e164 }) {
  const { rows } = await db.query(
    `SELECT id, email, phone_e164, password_hash, full_name, locale, status, preferences, created_at,
            email_verified_at, phone_verified_at, onboarding_last_step, onboarding_completed_at
     FROM users WHERE (lower(email) = lower($1) AND $1 IS NOT NULL)
        OR (phone_e164 = $2 AND $2 IS NOT NULL)
     LIMIT 1`,
    [email, phone_e164],
  );
  return rows[0] ?? null;
}

async function issueSession(db, user) {
  const { rows } = await db.query('SELECT role FROM user_roles WHERE user_id = $1', [user.id]);
  const roles = rows.map((r) => r.role);
  const accessToken = signAccessToken({ id: user.id, roles });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000).toISOString();
  await db.query(`INSERT INTO user_sessions (user_id, token_hash, kind, expires_at) VALUES ($1,$2,'refresh',$3)`, [
    user.id,
    hashToken(refreshToken),
    expiresAt,
  ]);
  return { roles, accessToken, refreshToken };
}

// Signup: creates the customer, assigns the role, issues an OTP for the channel.
// Tokens are granted only after OTP verification (funnel: signup → OTP → profile).
export async function customerSignup(db, input) {
  const channel = normalizeChannel(input);
  const existing = await findByChannel(db, channel);
  if (existing) throw httpError(409, 'ACCOUNT_EXISTS', 'An account with these details already exists. Try logging in.');

  const passwordHash = input.password ? await hashPassword(input.password) : null;
  const { rows } = await db.query(
    `INSERT INTO users (email, phone_e164, password_hash, full_name, status, onboarding_last_step)
     VALUES ($1,$2,$3,$4,'active','SIGNUP_STARTED') RETURNING id, email, phone_e164, full_name, locale, status, created_at`,
    [channel.email, channel.phone_e164, passwordHash, input.full_name.trim()],
  );
  const user = rows[0];
  await db.query('INSERT INTO user_roles (user_id, role) VALUES ($1,$2) ON CONFLICT DO NOTHING', [user.id, 'customer']);
  await recordAudit(db, { actorId: user.id, actorRole: 'customer', action: 'SIGNUP_STARTED', entityType: 'user', entityId: user.id, metadata: {} });

  const otp = await requestOtp(db, { identifier: channel, purpose: 'signup' });
  await track(db, { eventName: 'OTP_REQUESTED', userId: user.id, metadata: { purpose: 'signup' } });
  return { user: { ...toPublicUser(user), roles: ['customer'] }, otp };
}

// Verifies the signup/login OTP, stamps verification + funnel step, issues tokens.
export async function verifyCustomerOtp(db, { channel, purpose, code }) {
  await consumeOtp(db, { identifier: channel, purpose, code });
  const user = await findByChannel(db, channel);
  if (!user) throw httpError(404, 'NOT_FOUND', 'Account not found');
  if (user.status !== 'active') throw httpError(403, 'ACCOUNT_DISABLED', 'This account is not active');

  const verifiedCol = channel.email ? 'email_verified_at' : 'phone_verified_at';
  await db.query(
    `UPDATE users SET ${verifiedCol} = COALESCE(${verifiedCol}, now()),
       onboarding_last_step = CASE WHEN onboarding_last_step = 'REGISTRATION_COMPLETED' THEN onboarding_last_step ELSE 'OTP_VERIFIED' END,
       updated_at = now() WHERE id = $1`,
    [user.id],
  );
  await refreshOnboardingState(db, user.id);
  const freshUser = (await findByChannel(db, channel)) || user;
  const session = await issueSession(db, freshUser);
  await track(db, { eventName: 'OTP_VERIFIED', userId: freshUser.id, metadata: { purpose } });
  await recordAudit(db, {
    actorId: freshUser.id, actorRole: 'customer', action: 'OTP_VERIFIED',
    entityType: 'user', entityId: freshUser.id, metadata: { purpose },
  });
  return { user: { ...toPublicUser(freshUser), roles: session.roles }, ...session };
}

// Password login for customers (requires a password set at signup or via recovery).
export async function customerLogin(db, { identifier, password }) {
  const channel = normalizeChannel({ identifier });
  const user = await findByChannel(db, channel);
  const ok = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid login details');
  if (user.status !== 'active') throw httpError(403, 'ACCOUNT_DISABLED', 'This account is not active');
  await refreshOnboardingState(db, user.id);
  const freshUser = (await findByChannel(db, channel)) || user;
  const session = await issueSession(db, freshUser);
  if (!session.roles.includes('customer')) throw httpError(403, 'FORBIDDEN', 'Insufficient permissions');
  await recordAudit(db, { actorId: freshUser.id, actorRole: 'customer', action: 'LOGIN_SUCCESS', entityType: 'user', entityId: freshUser.id, metadata: {} });
  return { user: { ...toPublicUser(freshUser), roles: session.roles }, ...session };
}

// Recovery: OTP proves channel ownership, then the password is replaced.
export async function confirmRecovery(db, { channel, code, newPassword }) {
  await consumeOtp(db, { identifier: channel, purpose: 'recovery', code });
  const user = await findByChannel(db, channel);
  if (!user) throw httpError(404, 'NOT_FOUND', 'Account not found');
  await db.query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [
    await hashPassword(newPassword),
    user.id,
  ]);
  await db.query('UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [user.id]);
  await recordAudit(db, { actorId: user.id, actorRole: 'customer', action: 'PASSWORD_RECOVERED', entityType: 'user', entityId: user.id, metadata: {} });
  return { ok: true };
}

export { normalizeChannel, requestOtp };
