import { httpError } from '../../middleware/errorHandler.js';
import { toPublicUser } from '../../utils/dto.js';
import { verifyPassword } from './password.js';
import { signAccessToken, generateRefreshToken, hashToken } from './tokens.js';
import { recordAudit } from '../audit/writer.js';
import { refreshOnboardingState } from '../users/service.js';
import { recordSecurityEvent, maskIdentifier } from '../../security/events.js';

const REFRESH_TTL_DAYS = 30;
const OPS_LOGIN_ROLES = ['operations_head', 'operations_staff', 'content_manager', 'analytics_viewer'];

async function loadRoles(db, userId) {
  const { rows } = await db.query('SELECT role FROM user_roles WHERE user_id = $1', [userId]);
  return rows.map((r) => r.role);
}

// Failed authentications leave a security_events row (Operations → Security)
// even before the rate limiter trips. Never throws into the auth path.
async function recordLoginFailure(db, ctx, email, reason) {
  try {
    await recordSecurityEvent(db, {
      eventType: 'AUTH_FAILURE',
      severity: 'medium',
      ip: ctx?.ip ?? null,
      method: 'POST',
      path: '/ops/auth/login',
      detail: { surface: 'ops_login', reason, identifier: maskIdentifier(email) },
      requestId: null,
    });
  } catch { /* auth flow continues */ }
}

// Password login shared by ops (Phase 3) and customers (Phase 5).
// allowedRoles restricts which role-holders may use a given login surface.
export async function loginWithPassword(db, { email, password }, { allowedRoles = null, auditAction = 'LOGIN_SUCCESS', ctx = {} } = {}) {
  const { rows } = await db.query(
    'SELECT id, public_id, email, phone_e164, password_hash, full_name, locale, status, preferences, email_verified_at, phone_verified_at, onboarding_last_step, onboarding_completed_at, created_at FROM users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
  );
  let user = rows[0];
  const hashOk = user?.password_hash ? await verifyPassword(password, user.password_hash) : false;

  if (!user || !hashOk) {
    await recordLoginFailure(db, ctx, email, 'bad_credentials');
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
  if (user.status !== 'active') {
    await recordLoginFailure(db, ctx, email, 'disabled');
    throw httpError(403, 'ACCOUNT_DISABLED', 'This account is not active');
  }

  const roles = await loadRoles(db, user.id);
  if (allowedRoles && !roles.some((r) => allowedRoles.includes(r))) {
    await recordLoginFailure(db, ctx, email, 'role_denied');
    throw httpError(403, 'FORBIDDEN', 'Insufficient permissions');
  }

  await refreshOnboardingState(db, user.id);
  const refreshedUser = (await db.query(
    'SELECT id, public_id, email, phone_e164, password_hash, full_name, locale, status, preferences, email_verified_at, phone_verified_at, onboarding_last_step, onboarding_completed_at, created_at FROM users WHERE id = $1 LIMIT 1',
    [user.id],
  )).rows[0];
  if (refreshedUser) user = refreshedUser;

  const accessToken = signAccessToken({ id: user.id, roles });
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000).toISOString();
  await db.query(
    `INSERT INTO user_sessions (user_id, token_hash, kind, expires_at) VALUES ($1, $2, 'refresh', $3)`,
    [user.id, hashToken(refreshToken), expiresAt],
  );

  await recordAudit(db, {
    actorId: user.id, actorRole: roles[0] ?? null, action: auditAction,
    entityType: 'user', entityId: user.id, metadata: {},
  });

  return { user: { ...toPublicUser(user), roles }, accessToken, refreshToken };
}

export async function opsLogin(db, input, ctx = {}) {
  return loginWithPassword(db, input, { allowedRoles: OPS_LOGIN_ROLES, auditAction: 'OPS_LOGIN_SUCCESS', ctx });
}

export async function rotateRefresh(db, rawToken) {
  const digest = hashToken(rawToken);
  const { rows } = await db.query(
    `SELECT s.id, s.user_id, s.expires_at, s.revoked_at, u.status
     FROM user_sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.kind = 'refresh' LIMIT 1`,
    [digest],
  );
  const session = rows[0];
  if (!session) {
    throw httpError(401, 'UNAUTHENTICATED', 'Invalid or expired refresh token');
  }
  if (session.revoked_at) {
    // Reuse of a rotated-out token signals possible theft: kill every session.
    await db.query('UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [session.user_id]);
    await recordAudit(db, {
      actorId: session.user_id, actorRole: null, action: 'SESSION_REUSE_DETECTED',
      entityType: 'user', entityId: session.user_id, metadata: {},
    });
    throw httpError(401, 'UNAUTHENTICATED', 'Session expired. Please log in again.');
  }
  if (new Date(session.expires_at) <= new Date() || session.status !== 'active') {
    throw httpError(401, 'UNAUTHENTICATED', 'Invalid or expired refresh token');
  }
  const roles = await loadRoles(db, session.user_id);
  const accessToken = signAccessToken({ id: session.user_id, roles });
  const nextRefresh = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 3600 * 1000).toISOString();
  await db.query(`UPDATE user_sessions SET revoked_at = now() WHERE id = $1`, [session.id]);
  await db.query(
    `INSERT INTO user_sessions (user_id, token_hash, kind, expires_at) VALUES ($1, $2, 'refresh', $3)`,
    [session.user_id, hashToken(nextRefresh), expiresAt],
  );
  return { accessToken, refreshToken: nextRefresh, userId: session.user_id, roles };
}

export async function logout(db, rawToken) {
  await db.query(`UPDATE user_sessions SET revoked_at = now() WHERE token_hash = $1`, [hashToken(rawToken)]);
}

export async function logoutAll(db, userId) {
  const { rowCount } = await db.query(
    'UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId],
  );
  await recordAudit(db, { actorId: userId, actorRole: null, action: 'SESSIONS_REVOKED', entityType: 'user', entityId: userId, metadata: { count: rowCount } });
  return { revoked: rowCount };
}
