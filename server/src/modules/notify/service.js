import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { dispatch } from './providers.js';

// In-app notifications are the reliable channel; external dispatch is
// best-effort via the provider abstraction (never throws).

const FIELDS = ['id', 'type', 'title_en', 'body_en', 'entity_type', 'entity_id', 'is_read', 'read_at', 'created_at'];

export async function notifyUser(db, { userId, type, title_en, body_en, entityType = null, entityId = null }) {
  const { rows } = await db.query(
    `INSERT INTO notifications (user_id, type, title_en, body_en, entity_type, entity_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${FIELDS.join(',')}`,
    [userId, type, title_en, body_en, entityType, entityId ? String(entityId) : null],
  );
  // Best-effort external copy (log provider in V1). Lookup is non-blocking-safe.
  const contact = (await db.query('SELECT email, phone_e164 FROM users WHERE id = $1 LIMIT 1', [userId])).rows[0];
  if (contact?.email) {
    await dispatch({ channel: 'email', to: contact.email, title: title_en, body: body_en });
  } else if (contact?.phone_e164) {
    await dispatch({ channel: 'sms', to: contact.phone_e164, title: title_en, body: body_en });
  }
  return pick(rows[0], FIELDS);
}

export async function listNotifications(db, userId, { page, limit, unread }) {
  const params = [userId];
  let clause = 'WHERE user_id = $1';
  if (unread === 'true') clause += ' AND is_read = false';
  const total = (await db.query(`SELECT COUNT(*)::int AS count FROM notifications ${clause}`, params)).rows[0].count;
  const { rows } = await db.query(
    `SELECT ${FIELDS.join(',')} FROM notifications ${clause} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, (page - 1) * limit],
  );
  const unreadCount = (await db.query('SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false', [userId])).rows[0].count;
  return { items: rows.map((r) => pick(r, FIELDS)), total, unreadCount };
}

export async function markRead(db, userId, id) {
  const { rows } = await db.query(
    `UPDATE notifications SET is_read = true, read_at = COALESCE(read_at, now())
     WHERE id = $1 AND user_id = $2 RETURNING ${FIELDS.join(',')}`,
    [id, userId],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Notification not found');
  return pick(rows[0], FIELDS);
}

export async function markAllRead(db, userId) {
  const { rowCount } = await db.query(
    'UPDATE notifications SET is_read = true, read_at = COALESCE(read_at, now()) WHERE user_id = $1 AND is_read = false',
    [userId],
  );
  return { marked: rowCount };
}
