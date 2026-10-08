// DTO convention: routes return mapped objects, never raw DB rows.
// Every module exposes toPublic/toList DTOs built on pick().

export function pick(row, fields) {
  const out = {};
  for (const f of fields) {
    if (row[f] !== undefined) out[f] = row[f];
  }
  return out;
}

const PUBLIC_USER_FIELDS = [
  'id',
  'email',
  'phone_e164',
  'full_name',
  'locale',
  'status',
  'preferences',
  'email_verified_at',
  'phone_verified_at',
  'onboarding_last_step',
  'onboarding_completed_at',
  'created_at',
];

export function toPublicUser(row) {
  return pick(row, PUBLIC_USER_FIELDS);
}
