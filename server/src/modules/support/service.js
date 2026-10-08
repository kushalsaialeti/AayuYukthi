import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { notifyUser } from '../notify/service.js';

const TICKET_FIELDS = ['id', 'subject', 'status', 'priority', 'request_id', 'assigned_to', 'resolved_at', 'created_at', 'updated_at'];
const toTicket = (row) => pick(row, TICKET_FIELDS);

// Customer-visible thread: internal ops notes are stripped.
function toMessage(row, includeInternal) {
  const base = pick(row, ['id', 'sender_kind', 'message', 'created_at']);
  if (includeInternal) base.is_internal = row.is_internal;
  return base;
}

async function assertOwnedRequest(db, ownerId, requestId) {
  if (!requestId) return;
  const { rows } = await db.query('SELECT id FROM requests WHERE id = $1 AND owner_user_id = $2 LIMIT 1', [requestId, ownerId]);
  if (!rows[0]) throw httpError(400, 'INVALID_REQUEST_LINK', 'Linked request is not valid');
}

// ---- customer ----

export async function createTicket(db, actor, input) {
  await assertOwnedRequest(db, actor.actorId, input.request_id);
  const { rows } = await db.query(
    `INSERT INTO support_tickets (user_id, request_id, subject, status)
     VALUES ($1,$2,$3,'open') RETURNING ${TICKET_FIELDS.join(',')}`,
    [actor.actorId, input.request_id ?? null, input.subject.trim()],
  );
  await db.query(
    `INSERT INTO support_messages (ticket_id, sender_user_id, sender_kind, message) VALUES ($1,$2,'customer',$3)`,
    [rows[0].id, actor.actorId, input.message.trim()],
  );
  await recordAudit(db, { ...actor, action: 'SUPPORT_REQUEST_CREATED', entityType: 'support_tickets', entityId: rows[0].id, metadata: {} });
  return { ticket: toTicket(rows[0]), messages: await thread(db, rows[0].id, false) };
}

export async function listTickets(db, userId, { page, limit }) {
  const total = (await db.query('SELECT COUNT(*)::int AS count FROM support_tickets WHERE user_id = $1', [userId])).rows[0].count;
  const { rows } = await db.query(
    `SELECT ${TICKET_FIELDS.join(',')} FROM support_tickets WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, (page - 1) * limit],
  );
  return { items: rows.map(toTicket), total };
}

async function thread(db, ticketId, includeInternal) {
  const { rows } = await db.query(
    `SELECT id, sender_kind, message, is_internal, created_at FROM support_messages
     WHERE ticket_id = $1 ${includeInternal ? '' : 'AND is_internal = false'} ORDER BY created_at ASC`,
    [ticketId],
  );
  return rows.map((r) => toMessage(r, includeInternal));
}

async function ownedTicket(db, userId, id) {
  const { rows } = await db.query(
    `SELECT ${TICKET_FIELDS.join(',')}, user_id FROM support_tickets WHERE id = $1 AND user_id = $2 LIMIT 1`, [id, userId],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Support request not found');
  return rows[0];
}

export async function getTicket(db, userId, id) {
  const ticket = await ownedTicket(db, userId, id);
  return { ticket: toTicket(ticket), messages: await thread(db, id, false) };
}

export async function replyToTicket(db, actor, id, message) {
  const ticket = await ownedTicket(db, actor.actorId, id);
  if (['resolved', 'closed'].includes(ticket.status)) {
    throw httpError(409, 'TICKET_CLOSED', 'This request is closed. Open a new one if you need more help.');
  }
  await db.query(
    `INSERT INTO support_messages (ticket_id, sender_user_id, sender_kind, message) VALUES ($1,$2,'customer',$3)`,
    [id, actor.actorId, message.trim()],
  );
  await db.query(`UPDATE support_tickets SET updated_at = now(),
    status = CASE WHEN status = 'waiting_on_customer' THEN 'in_progress'::text ELSE status END WHERE id = $1`, [id]);
  // Ping the assignee so the reply gets seen.
  const { rows } = await db.query('SELECT assigned_to FROM support_tickets WHERE id = $1', [id]);
  if (rows[0]?.assigned_to) {
    await notifyUser(db, {
      userId: rows[0].assigned_to, type: 'support_update',
      title_en: 'New customer reply', body_en: `Ticket "${ticket.subject}" has a new reply.`,
      entityType: 'support_tickets', entityId: id,
    });
  }
  return getTicket(db, actor.actorId, id);
}

export async function closeTicket(db, actor, id) {
  await ownedTicket(db, actor.actorId, id);
  await db.query(`UPDATE support_tickets SET status = 'closed', updated_at = now() WHERE id = $1`, [id]);
  return getTicket(db, actor.actorId, id);
}

// ---- operations ----

const OPS_TRANSITIONS = {
  open: ['in_progress', 'closed'],
  in_progress: ['waiting_on_customer', 'resolved', 'closed'],
  waiting_on_customer: ['in_progress', 'resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
};

export async function listOpsTickets(db, { page, limit, status, priority, assigned, q }) {
  const params = [];
  const where = [];
  if (status) {
    const list = String(status).split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length) {
      params.push(list);
      where.push(`t.status = ANY($${params.length})`);
    }
  }
  if (priority) {
    params.push(priority);
    where.push(`t.priority = $${params.length}`);
  }
  if (assigned === 'unassigned') where.push('t.assigned_to IS NULL');
  else if (assigned) {
    params.push(assigned);
    where.push(`t.assigned_to = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(t.subject ILIKE $${i} OR u.full_name ILIKE $${i} OR u.email ILIKE $${i})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const from = `FROM support_tickets t JOIN users u ON u.id = t.user_id
    LEFT JOIN users a ON a.id = t.assigned_to ${clause}`;
  const total = (await db.query(`SELECT COUNT(*)::int AS count ${from}`, params)).rows[0].count;
  const pageParams = [...params, limit, (page - 1) * limit];
  const { rows } = await db.query(
    `SELECT ${TICKET_FIELDS.map((c) => `t.${c}`).join(',')},
            u.full_name AS customer_name, u.email AS customer_email, a.full_name AS assignee_name
     ${from} ORDER BY t.updated_at DESC LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams,
  );
  return { items: rows, total };
}

export async function getOpsTicket(db, id) {
  const { rows } = await db.query(
    `SELECT ${TICKET_FIELDS.map((c) => `t.${c}`).join(',')},
            u.full_name AS customer_name, u.email AS customer_email, u.phone_e164 AS customer_phone
     FROM support_tickets t JOIN users u ON u.id = t.user_id WHERE t.id = $1 LIMIT 1`,
    [id],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Support request not found');
  return { ticket: { ...toTicket(rows[0]), customer_name: rows[0].customer_name, customer_email: rows[0].customer_email, customer_phone: rows[0].customer_phone }, messages: await thread(db, id, true) };
}

export async function opsReply(db, actor, id, { message, is_internal }) {
  const detail = await getOpsTicket(db, id);
  if (detail.ticket.status === 'closed') throw httpError(409, 'TICKET_CLOSED', 'This request is closed');
  await db.query(
    `INSERT INTO support_messages (ticket_id, sender_user_id, sender_kind, message, is_internal)
     VALUES ($1,$2,'operations',$3,$4)`,
    [id, actor.actorId, message.trim(), is_internal ?? false],
  );
  await db.query(`UPDATE support_tickets SET updated_at = now(),
    status = CASE WHEN status = 'open' THEN 'in_progress'::text ELSE status END WHERE id = $1`, [id]);
  await recordAudit(db, { ...actor, action: 'SUPPORT_TICKET_UPDATED', entityType: 'support_tickets', entityId: id, metadata: { internal: is_internal ?? false } });
  if (!is_internal) {
    const { rows } = await db.query('SELECT user_id, subject FROM support_tickets WHERE id = $1', [id]);
    await notifyUser(db, {
      userId: rows[0].user_id, type: 'support_update',
      title_en: 'New reply on your support request', body_en: message.trim().slice(0, 200),
      entityType: 'support_tickets', entityId: id,
    });
  }
  return getOpsTicket(db, id);
}

export async function opsSetStatus(db, actor, id, toStatus) {
  const detail = await getOpsTicket(db, id);
  const allowed = OPS_TRANSITIONS[detail.ticket.status] ?? [];
  if (!allowed.includes(toStatus)) {
    throw httpError(409, 'INVALID_STATUS_TRANSITION', `Cannot move ticket from ${detail.ticket.status} to ${toStatus}`);
  }
  await db.query(
    `UPDATE support_tickets SET status = $1, updated_at = now(),
       resolved_at = CASE WHEN $1 IN ('resolved','closed') THEN COALESCE(resolved_at, now()) ELSE resolved_at END
     WHERE id = $2`,
    [toStatus, id],
  );
  await recordAudit(db, { ...actor, action: 'SUPPORT_TICKET_UPDATED', entityType: 'support_tickets', entityId: id, metadata: { to: toStatus } });
  if (toStatus === 'resolved') {
    const { rows } = await db.query('SELECT user_id FROM support_tickets WHERE id = $1', [id]);
    await notifyUser(db, {
      userId: rows[0].user_id, type: 'support_update',
      title_en: 'Your support request is resolved', body_en: 'Let us know if you need anything else.',
      entityType: 'support_tickets', entityId: id,
    });
  }
  return getOpsTicket(db, id);
}

export async function opsAssignTicket(db, actor, id, assigneeId) {
  await getOpsTicket(db, id);
  if (assigneeId) {
    const { rows } = await db.query(
      `SELECT 1 FROM user_roles WHERE user_id = $1 AND role IN ('operations_head','operations_staff') LIMIT 1`, [assigneeId],
    );
    if (!rows[0]) throw httpError(400, 'INVALID_ASSIGNEE', 'Assignee must be operations staff');
  }
  await db.query('UPDATE support_tickets SET assigned_to = $1, updated_at = now() WHERE id = $2', [assigneeId ?? null, id]);
  await recordAudit(db, { ...actor, action: 'SUPPORT_TICKET_UPDATED', entityType: 'support_tickets', entityId: id, metadata: { assigned_to: assigneeId ?? null } });
  return getOpsTicket(db, id);
}

export async function opsSetPriority(db, actor, id, priority) {
  await getOpsTicket(db, id);
  await db.query('UPDATE support_tickets SET priority = $1, updated_at = now() WHERE id = $2', [priority, id]);
  await recordAudit(db, { ...actor, action: 'SUPPORT_TICKET_UPDATED', entityType: 'support_tickets', entityId: id, metadata: { priority } });
  return getOpsTicket(db, id);
}
