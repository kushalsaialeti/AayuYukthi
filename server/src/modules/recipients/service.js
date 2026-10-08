import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { refreshOnboardingState } from '../users/service.js';

const FIELDS = ['id', 'full_name', 'relationship', 'date_of_birth', 'gender', 'phone_e164', 'notes', 'created_at', 'updated_at'];
const COLUMNS = FIELDS.join(', ');

const toDto = (row) => pick(row, FIELDS);

export async function listRecipients(db, ownerId, { page, limit }) {
  const total = (await db.query('SELECT COUNT(*)::int AS count FROM care_recipients WHERE owner_user_id = $1', [ownerId])).rows[0].count;
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM care_recipients WHERE owner_user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [ownerId, limit, (page - 1) * limit],
  );
  return { items: rows.map(toDto), total };
}

export async function getRecipient(db, ownerId, id) {
  const { rows } = await db.query(`SELECT ${COLUMNS} FROM care_recipients WHERE id = $1 AND owner_user_id = $2 LIMIT 1`, [id, ownerId]);
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Care recipient not found');
  return toDto(rows[0]);
}

export async function createRecipient(db, actor, input) {
  const { rows } = await db.query(
    `INSERT INTO care_recipients (owner_user_id, full_name, relationship, date_of_birth, gender, phone_e164, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING ${COLUMNS}`,
    [actor.actorId, input.full_name.trim(), input.relationship ?? 'other', input.date_of_birth ?? null,
      input.gender ?? null, input.phone_e164 ?? null, input.notes ?? ''],
  );
  await recordAudit(db, { ...actor, action: 'RECIPIENT_CREATED', entityType: 'care_recipients', entityId: rows[0].id, metadata: {} });
  const step = await refreshOnboardingState(db, actor.actorId);
  if (step === 'REGISTRATION_COMPLETED') {
    await recordAudit(db, { ...actor, action: 'REGISTRATION_COMPLETED', entityType: 'user', entityId: actor.actorId, metadata: {} });
  }
  return { recipient: toDto(rows[0]), onboardingStep: step };
}

export async function updateRecipient(db, actor, id, input) {
  await getRecipient(db, actor.actorId, id);
  const sets = [];
  const params = [];
  const map = { full_name: (v) => v.trim(), relationship: (v) => v, date_of_birth: (v) => v, gender: (v) => v, phone_e164: (v) => v, notes: (v) => v ?? '' };
  for (const [k, fn] of Object.entries(map)) {
    if (input[k] !== undefined) {
      params.push(fn(input[k]));
      sets.push(`${k} = $${params.length}`);
    }
  }
  if (!sets.length) return { recipient: await getRecipient(db, actor.actorId, id) };
  params.push(id, actor.actorId);
  const { rows } = await db.query(
    `UPDATE care_recipients SET ${sets.join(', ')}, updated_at = now()
     WHERE id = $${params.length - 1} AND owner_user_id = $${params.length} RETURNING ${COLUMNS}`,
    params,
  );
  await recordAudit(db, { ...actor, action: 'RECIPIENT_UPDATED', entityType: 'care_recipients', entityId: id, metadata: {} });
  return { recipient: toDto(rows[0]) };
}

export async function deleteRecipient(db, actor, id) {
  await getRecipient(db, actor.actorId, id);
  try {
    await db.query('DELETE FROM care_recipients WHERE id = $1 AND owner_user_id = $2', [id, actor.actorId]);
  } catch (err) {
    // 23503 on real Postgres; PGlite surfaces RESTRICT violations as 23001.
    if (['REFERENCE_NOT_FOUND', '23503', '23001'].includes(err.code)) {
      throw httpError(409, 'RECIPIENT_IN_USE', 'This person is linked to a care request and cannot be removed');
    }
    throw err;
  }
  await recordAudit(db, { ...actor, action: 'RECIPIENT_DELETED', entityType: 'care_recipients', entityId: id, metadata: {} });
  return { ok: true };
}
