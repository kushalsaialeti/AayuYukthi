import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { notifyUser } from '../notify/service.js';

// Closed status machine: every transition is allow-listed, terminal states
// are final, and ACTION_REQUIRED must tell the customer what to do.
export const TRANSITIONS = {
  REQUEST_RECEIVED: ['UNDER_REVIEW', 'CANCELLED'],
  UNDER_REVIEW: ['COORDINATION_IN_PROGRESS', 'ACTION_REQUIRED', 'CANCELLED'],
  COORDINATION_IN_PROGRESS: ['CONFIRMED', 'ACTION_REQUIRED', 'CANCELLED'],
  ACTION_REQUIRED: ['UNDER_REVIEW', 'COORDINATION_IN_PROGRESS', 'CANCELLED'],
  CONFIRMED: ['SCHEDULED', 'CANCELLED'],
  SCHEDULED: ['SERVICE_IN_PROGRESS', 'CANCELLED'],
  SERVICE_IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

const TERMINAL_AT = { COMPLETED: 'completed_at', CANCELLED: 'cancelled_at' };

export function allowedTransitions(from) {
  return TRANSITIONS[from] ?? [];
}

export async function listOpsRequests(db, actorId, { page, limit, status, assigned, q }) {
  const params = [];
  const where = [];
  if (status) {
    const list = String(status).split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length) {
      params.push(list);
      where.push(`r.status = ANY($${params.length})`);
    }
  }
  if (assigned === 'me') {
    params.push(actorId);
    where.push(`r.assigned_to = $${params.length}`);
  } else if (assigned === 'unassigned') {
    where.push('r.assigned_to IS NULL');
  } else if (assigned) {
    params.push(assigned);
    where.push(`r.assigned_to = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    const i = params.length;
    where.push(`(u.full_name ILIKE $${i} OR u.email ILIKE $${i} OR s.title_en ILIKE $${i} OR h.name_en ILIKE $${i} OR r.id::text ILIKE $${i})`);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const from = `FROM requests r
    JOIN users u ON u.id = r.owner_user_id
    JOIN services s ON s.id = r.service_id
    JOIN hospitals h ON h.id = r.hospital_id
    LEFT JOIN users a ON a.id = r.assigned_to ${clause}`;
  const total = (await db.query(`SELECT COUNT(*)::int AS count ${from}`, params)).rows[0].count;
  const pageParams = [...params, limit, (page - 1) * limit];
  const { rows } = await db.query(
    `SELECT r.id, r.status, r.appointment_date, r.schedule_at, r.created_at, r.updated_at,
            u.full_name AS customer_name, u.email AS customer_email,
            s.title_en AS service_title, h.name_en AS hospital_name,
            a.full_name AS assignee_name
     ${from} ORDER BY r.created_at DESC LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`,
    pageParams,
  );
  return { items: rows.map((r) => pick(r, Object.keys(r))), total };
}

export async function getOpsRequest(db, id) {
  const { rows } = await db.query(
    `SELECT r.id, r.status, r.appointment_type, r.appointment_date, r.schedule_at,
            r.pickup_required, r.pickup_address, r.additional_requirements,
            r.doctor_name, r.room_number, r.station_manager, r.station_location,
            r.station_intercom, r.station_phone, r.companion_phone, r.companion_badge_id,
            r.visit_summary, r.telemetry_data,
            r.assigned_to, r.completed_at, r.cancelled_at, r.created_at, r.updated_at,
            u.id AS customer_id, u.full_name AS customer_name, u.email AS customer_email,
            u.phone_e164 AS customer_phone,
            rec.id AS recipient_id, rec.full_name AS recipient_name, rec.relationship AS recipient_relationship,
            rec.date_of_birth AS recipient_dob, rec.phone_e164 AS recipient_phone,
            s.id AS service_id, s.title_en AS service_title, s.slug AS service_slug,
            h.id AS hospital_id, h.name_en AS hospital_name, h.slug AS hospital_slug, h.city AS hospital_city,
            a.full_name AS assignee_name, a.phone_e164 AS assignee_phone
     FROM requests r
     JOIN users u ON u.id = r.owner_user_id
     JOIN care_recipients rec ON rec.id = r.recipient_id
     JOIN services s ON s.id = r.service_id
     JOIN hospitals h ON h.id = r.hospital_id
     LEFT JOIN users a ON a.id = r.assigned_to
     WHERE r.id = $1 LIMIT 1`,
    [id],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Request not found');
  const r = rows[0];
  const history = (await db.query(
    `SELECT to_status, from_status, note_internal, customer_message, created_at,
            (SELECT full_name FROM users WHERE id = changed_by) AS changed_by_name
     FROM request_status_history WHERE request_id = $1 ORDER BY created_at ASC`,
    [id],
  )).rows;
  return {
    ...pick(r, ['id', 'status', 'appointment_type', 'appointment_date', 'schedule_at', 'pickup_required',
      'pickup_address', 'additional_requirements', 'doctor_name', 'room_number', 'station_manager',
      'station_location', 'station_intercom', 'station_phone', 'companion_phone', 'companion_badge_id',
      'visit_summary', 'telemetry_data', 'assigned_to', 'assignee_name', 'assignee_phone',
      'completed_at', 'cancelled_at', 'created_at', 'updated_at']),
    customer: { id: r.customer_id, name: r.customer_name, email: r.customer_email, phone: r.customer_phone },
    recipient: { id: r.recipient_id, name: r.recipient_name, relationship: r.recipient_relationship, date_of_birth: r.recipient_dob, phone: r.recipient_phone },
    service: { id: r.service_id, title: r.service_title, slug: r.service_slug },
    hospital: { id: r.hospital_id, name: r.hospital_name, slug: r.hospital_slug, city: r.hospital_city },
    allowed_transitions: allowedTransitions(r.status),
    timeline: history,
  };
}

export async function changeRequestStatus(db, actor, id, { to_status, note_internal, customer_message }) {
  const current = await getOpsRequest(db, id);
  if (!allowedTransitions(current.status).includes(to_status)) {
    throw httpError(409, 'INVALID_STATUS_TRANSITION', `Cannot move from ${current.status} to ${to_status}`);
  }
  if (to_status === 'ACTION_REQUIRED' && !(customer_message ?? '').trim()) {
    throw httpError(400, 'CUSTOMER_MESSAGE_REQUIRED', 'Tell the customer what is needed before requesting action');
  }
  const terminalCol = TERMINAL_AT[to_status];
  await db.query(
    `UPDATE requests SET status = $1, updated_at = now()${terminalCol ? `, ${terminalCol} = now()` : ''} WHERE id = $2`,
    [to_status, id],
  );
  await db.query(
    `INSERT INTO request_status_history (request_id, from_status, to_status, changed_by, note_internal, customer_message)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, current.status, to_status, actor.actorId, note_internal?.trim() || null, customer_message?.trim() || null],
  );
  await recordAudit(db, {
    ...actor, action: 'REQUEST_STATUS_CHANGED', entityType: 'requests', entityId: id,
    metadata: { from: current.status, to: to_status },
  });
  if ((customer_message ?? '').trim()) {
    await notifyUser(db, {
      userId: current.customer.id, type: to_status === 'SCHEDULED' || to_status === 'CONFIRMED' ? 'appointment_update' : 'request_update',
      title_en: `Update on your request: ${current.service.title}`,
      body_en: customer_message.trim().slice(0, 500),
      entityType: 'requests', entityId: id,
    });
  }
  return getOpsRequest(db, id);
}

export async function assignRequest(db, actor, id, assigneeId) {
  await getOpsRequest(db, id);
  if (assigneeId) {
    const { rows } = await db.query(
      `SELECT 1 FROM user_roles WHERE user_id = $1 AND role IN ('operations_head','operations_staff') LIMIT 1`,
      [assigneeId],
    );
    if (!rows[0]) throw httpError(400, 'INVALID_ASSIGNEE', 'Assignee must be operations staff');
  }
  await db.query('UPDATE requests SET assigned_to = $1, updated_at = now() WHERE id = $2', [assigneeId ?? null, id]);
  await recordAudit(db, { ...actor, action: 'REQUEST_ASSIGNED', entityType: 'requests', entityId: id, metadata: { assigned_to: assigneeId ?? null } });
  return getOpsRequest(db, id);
}

export async function updateOpsRequest(db, actor, id, patch) {
  const current = await getOpsRequest(db, id);

  if (patch.hospital_id && patch.hospital_id !== current.hospital.id) {
    const { rows } = await db.query('SELECT id FROM hospitals WHERE id = $1 LIMIT 1', [patch.hospital_id]);
    if (!rows[0]) throw httpError(400, 'INVALID_HOSPITAL', 'Hospital not found');
  }

  if (patch.service_id && patch.service_id !== current.service.id) {
    const { rows } = await db.query('SELECT id FROM services WHERE id = $1 LIMIT 1', [patch.service_id]);
    if (!rows[0]) throw httpError(400, 'INVALID_SERVICE', 'Service not found');
  }

  if (patch.assigned_to !== undefined && patch.assigned_to !== current.assigned_to) {
    const assignee = patch.assigned_to === '' ? null : patch.assigned_to;
    if (assignee) {
      const { rows } = await db.query(
        `SELECT 1 FROM user_roles WHERE user_id = $1 AND role IN ('operations_head','operations_staff') LIMIT 1`,
        [assignee],
      );
      if (!rows[0]) throw httpError(400, 'INVALID_ASSIGNEE', 'Assignee must be operations staff');
    }
  }

  const updates = [];
  const params = [id];
  const allowedFields = [
    'appointment_type',
    'appointment_date',
    'schedule_at',
    'pickup_required',
    'pickup_address',
    'additional_requirements',
    'hospital_id',
    'service_id',
    'assigned_to',
    'doctor_name',
    'room_number',
    'station_manager',
    'station_location',
    'station_intercom',
    'station_phone',
    'companion_phone',
    'companion_badge_id',
    'visit_summary',
  ];

  const modified = {};
  for (const field of allowedFields) {
    if (patch[field] !== undefined) {
      const val = patch[field] === '' ? null : patch[field];
      params.push(val);
      updates.push(`${field} = $${params.length}`);
      modified[field] = val;
    }
  }

  if (updates.length > 0) {
    updates.push('updated_at = now()');
    await db.query(`UPDATE requests SET ${updates.join(', ')} WHERE id = $1`, params);
  }

  const custMsg = (patch.customer_message || patch.visit_summary || '').trim();
  const internalNote = (patch.note_internal || '').trim();

  if (custMsg || internalNote) {
    await db.query(
      `INSERT INTO request_status_history (request_id, from_status, to_status, changed_by, note_internal, customer_message)
       VALUES ($1, $2, $2, $3, $4, $5)`,
      [id, current.status, actor.actorId, internalNote || null, custMsg || null],
    );

    if (custMsg) {
      await notifyUser(db, {
        userId: current.customer.id,
        type: 'request_update',
        title_en: `Care Update: ${current.service.title}`,
        body_en: custMsg.slice(0, 500),
        entityType: 'requests',
        entityId: id,
      });
    }
  }

  await recordAudit(db, {
    ...actor,
    action: 'REQUEST_UPDATED',
    entityType: 'requests',
    entityId: id,
    metadata: { ...modified, has_customer_message: Boolean(custMsg) },
  });

  return getOpsRequest(db, id);
}

