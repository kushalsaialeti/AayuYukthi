import { httpError } from '../../middleware/errorHandler.js';
import { toPublicUser } from '../../utils/dto.js';
import { track } from '../analytics/events.js';

const PROFILE_FIELDS = `id, email, phone_e164, full_name, locale, status, preferences,
  email_verified_at, phone_verified_at, onboarding_last_step, onboarding_completed_at, created_at`;

export function toProfileDto(row, roles = []) {
  return {
    ...toPublicUser(row),
    preferences: row.preferences ?? {},
    email_verified_at: row.email_verified_at ?? null,
    phone_verified_at: row.phone_verified_at ?? null,
    onboarding_last_step: row.onboarding_last_step ?? null,
    onboarding_completed_at: row.onboarding_completed_at ?? null,
    roles,
  };
}

export async function getProfile(db, userId) {
  await refreshOnboardingState(db, userId);
  const { rows } = await db.query(`SELECT ${PROFILE_FIELDS} FROM users WHERE id = $1 LIMIT 1`, [userId]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Account not found');
  const roles = (await db.query('SELECT role FROM user_roles WHERE user_id = $1', [userId])).rows.map((r) => r.role);
  return toProfileDto(rows[0], roles);
}

// Completion rule (single place): verified channel + name + at least one recipient.
export async function refreshOnboardingState(db, userId) {
  const { rows } = await db.query(
    `SELECT id, email, phone_e164, full_name, email_verified_at, phone_verified_at,
            onboarding_completed_at, onboarding_last_step, status,
            (SELECT COUNT(*)::int FROM care_recipients WHERE owner_user_id = $1) AS recipient_count
     FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  );
  const u = rows[0];
  if (!u) return;
  const hasChannel = !!(u.email_verified_at || u.phone_verified_at || (u.status === 'active' && (u.email || u.phone_e164)));
  const profileDone = !!(u.full_name && u.full_name.trim().length > 0) && hasChannel;
  let step = u.onboarding_last_step;
  if (profileDone && u.recipient_count > 0) {
    if (!u.onboarding_completed_at || u.onboarding_last_step !== 'REGISTRATION_COMPLETED') {
      await db.query(
        `UPDATE users SET onboarding_last_step = 'REGISTRATION_COMPLETED', onboarding_completed_at = COALESCE(onboarding_completed_at, now()), updated_at = now()
         WHERE id = $1`,
        [userId],
      );
      await track(db, { eventName: 'REGISTRATION_COMPLETED', userId });
    }
    step = 'REGISTRATION_COMPLETED';
  }
  return step;
}

export async function updateProfile(db, userId, input) {
  const updates = [];
  const params = [];
  if (input.full_name !== undefined) {
    params.push(input.full_name.trim());
    updates.push(`full_name = $${params.length}`);
  }
  if (input.locale !== undefined) {
    params.push(input.locale);
    updates.push(`locale = $${params.length}`);
  }
  if (input.preferences !== undefined) {
    params.push(JSON.stringify(input.preferences));
    updates.push(`preferences = $${params.length}::jsonb`);
  }
  if (!updates.length) return getProfile(db, userId);
  params.push(userId);
  await db.query(
    `UPDATE users SET ${updates.join(', ')},
       onboarding_last_step = CASE WHEN onboarding_last_step = 'REGISTRATION_COMPLETED' THEN onboarding_last_step ELSE 'PROFILE_COMPLETED' END,
       updated_at = now() WHERE id = $${params.length}`,
    params,
  );
  await refreshOnboardingState(db, userId);
  return getProfile(db, userId);
}
