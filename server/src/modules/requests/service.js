import { httpError } from '../../middleware/errorHandler.js';
import { pick } from '../../utils/dto.js';
import { recordAudit } from '../audit/writer.js';
import { track } from '../analytics/events.js';

const REQUEST_FIELDS = ['id', 'service_id', 'hospital_id', 'recipient_id', 'appointment_type',
  'appointment_date', 'schedule_at', 'pickup_required', 'pickup_address', 'dropoff_address', 'update_phone',
  'additional_requirements', 'status', 'completed_at', 'cancelled_at', 'created_at', 'updated_at',
  'doctor_name', 'room_number', 'station_manager', 'station_location', 'station_intercom',
  'station_phone', 'companion_phone', 'companion_badge_id', 'visit_summary', 'telemetry_data'];

const toRequestDto = (row) => pick(row, REQUEST_FIELDS);
const toDraftDto = (row) => pick(row, ['id', 'idempotency_key', 'current_step', 'payload', 'updated_at']);

// ---- drafts ----

export async function saveDraft(db, ownerId, { idempotency_key, current_step, payload }) {
  const { rows } = await db.query(
    `INSERT INTO request_drafts (owner_user_id, idempotency_key, current_step, payload)
     VALUES ($1,$2,$3,$4::jsonb)
     ON CONFLICT (owner_user_id, idempotency_key) DO UPDATE
       SET current_step = $3, payload = $4::jsonb, updated_at = now()
     RETURNING id, idempotency_key, current_step, payload, updated_at`,
    [ownerId, idempotency_key, current_step, JSON.stringify(payload ?? {})],
  );
  return toDraftDto(rows[0]);
}

export async function getDraft(db, ownerId, idempotencyKey) {
  const { rows } = await db.query(
    `SELECT id, idempotency_key, current_step, payload, updated_at FROM request_drafts
     WHERE owner_user_id = $1 AND idempotency_key = $2 LIMIT 1`,
    [ownerId, idempotencyKey],
  );
  return rows[0] ? toDraftDto(rows[0]) : null;
}

// ---- submit ----

async function assertOwnedRecipient(db, ownerId, recipientId) {
  const { rows } = await db.query(
    'SELECT id FROM care_recipients WHERE id = $1 AND owner_user_id = $2 LIMIT 1', [recipientId, ownerId],
  );
  if (!rows[0]) throw httpError(400, 'INVALID_RECIPIENT', 'Selected care recipient is not valid');
}

async function assertPublished(db, table, id, label) {
  const { rows } = await db.query(
    `SELECT id FROM ${table} WHERE id = $1 AND status = 'published' AND is_visible = true LIMIT 1`, [id],
  );
  if (!rows[0]) throw httpError(400, label, 'Selected option is no longer available');
}

export async function submitRequest(db, actor, input) {
  const ownerId = actor.actorId;
  await assertOwnedRecipient(db, ownerId, input.recipient_id);
  await assertPublished(db, 'services', input.service_id, 'INVALID_SERVICE');
  await assertPublished(db, 'hospitals', input.hospital_id, 'INVALID_HOSPITAL');

  const dup = await db.query(
    'SELECT id FROM requests WHERE owner_user_id = $1 AND idempotency_key = $2 LIMIT 1',
    [ownerId, input.idempotency_key],
  );
  if (dup.rows[0]) {
    const existing = await getCustomerRequest(db, ownerId, dup.rows[0].id);
    return { request: existing, duplicate: true };
  }

  const insert = async (client) => {
    const query = client ? (t, p) => client.query(t, p) : (t, p) => db.query(t, p);
    const { rows } = await query(
      `INSERT INTO requests (owner_user_id, recipient_id, service_id, hospital_id, appointment_type,
          appointment_date, schedule_at, pickup_required, pickup_address, dropoff_address, update_phone,
          additional_requirements, status, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'REQUEST_RECEIVED',$13) RETURNING ${REQUEST_FIELDS.join(',')}`,
      [ownerId, input.recipient_id, input.service_id, input.hospital_id, input.appointment_type ?? null,
        input.appointment_date ?? null, input.schedule_at ?? null, input.pickup_required ?? false,
        input.pickup_address ?? null, input.dropoff_address ?? null, input.update_phone ?? null,
        input.additional_requirements ?? null, input.idempotency_key],
    );
    await query(
      `INSERT INTO request_status_history (request_id, from_status, to_status, customer_message)
       VALUES ($1, NULL, 'REQUEST_RECEIVED', 'We received your request and will review it shortly.')`,
      [rows[0].id],
    );
    await query('DELETE FROM request_drafts WHERE owner_user_id = $1 AND idempotency_key = $2', [ownerId, input.idempotency_key]);
    return rows[0];
  };

  // Prefer a transaction when the handle supports it (live pool); embedded test handles run sequentially.
  const row = db.withTransaction
    ? await db.withTransaction((client) => insert({ query: (t, p) => client.query(t, p) }))
    : await insert(null);

  await recordAudit(db, { ...actor, action: 'REQUEST_SUBMITTED', entityType: 'requests', entityId: row.id, metadata: {} });
  await track(db, { eventName: 'REQUEST_SUBMITTED', userId: ownerId, metadata: { service_id: input.service_id } });
  return { request: await getCustomerRequest(db, ownerId, row.id), duplicate: false };
}

// ---- customer reads (never expose note_internal) ----

export async function listCustomerRequests(db, ownerId, { page, limit, status }) {
  const params = [ownerId];
  let clause = 'WHERE r.owner_user_id = $1';
  if (status) {
    params.push(status);
    clause += ` AND r.status = $${params.length}`;
  }
  const total = (await db.query(`SELECT COUNT(*)::int AS count FROM requests r ${clause}`, params)).rows[0].count;
  params.push(limit, (page - 1) * limit);
  const { rows } = await db.query(
    `SELECT ${REQUEST_FIELDS.map((c) => `r.${c}`).join(', ')},
            rec.full_name AS recipient_name, rec.relationship AS recipient_relationship, rec.date_of_birth AS recipient_dob,
            s.title_en AS service_title, s.slug AS service_slug,
            h.name_en AS hospital_name, h.slug AS hospital_slug, h.city AS hospital_city,
            coord.full_name AS coordinator_name, coord.phone_e164 AS coordinator_phone,
            (SELECT customer_message FROM request_status_history
             WHERE request_id = r.id AND customer_message IS NOT NULL AND customer_message != ''
             ORDER BY created_at DESC LIMIT 1) AS latest_summary
     FROM requests r
     JOIN care_recipients rec ON rec.id = r.recipient_id
     JOIN services s ON s.id = r.service_id
     JOIN hospitals h ON h.id = r.hospital_id
     LEFT JOIN users coord ON coord.id = r.assigned_to
     ${clause} ORDER BY r.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return { items: rows.map(enrich), total };
}

function enrich(row) {
  const dto = toRequestDto(row);
  const policy = getCancellationPolicy(row);
  return {
    ...dto,
    cancellable: policy.allowed,
    cancellation_policy: policy,
    recipient: {
      name: row.recipient_name,
      relationship: row.recipient_relationship,
      date_of_birth: row.recipient_dob,
    },
    service: { title: row.service_title, slug: row.service_slug },
    hospital: {
      name: row.hospital_name,
      slug: row.hospital_slug,
      city: row.hospital_city,
      station_lead: row.hospital_station_lead ?? null,
      campus_guide: row.hospital_campus_guide ?? null,
    },
    coordinator: row.coordinator_name ? {
      name: row.coordinator_name,
      phone: row.companion_phone || row.coordinator_phone || null,
      badge_id: row.companion_badge_id || null,
    } : null,
    latest_summary: row.latest_summary ?? row.visit_summary ?? null,
  };
}

export async function getCustomerRequest(db, ownerId, id) {
  const { rows } = await db.query(
    `SELECT ${REQUEST_FIELDS.map((c) => `r.${c}`).join(', ')},
            rec.full_name AS recipient_name, rec.relationship AS recipient_relationship, rec.date_of_birth AS recipient_dob,
            s.title_en AS service_title, s.slug AS service_slug,
            h.name_en AS hospital_name, h.slug AS hospital_slug, h.city AS hospital_city,
            h.station_lead AS hospital_station_lead, h.campus_guide_en AS hospital_campus_guide,
            coord.full_name AS coordinator_name, coord.phone_e164 AS coordinator_phone,
            (SELECT customer_message FROM request_status_history
             WHERE request_id = r.id AND customer_message IS NOT NULL AND customer_message != ''
             ORDER BY created_at DESC LIMIT 1) AS latest_summary
     FROM requests r
     JOIN care_recipients rec ON rec.id = r.recipient_id
     JOIN services s ON s.id = r.service_id
     JOIN hospitals h ON h.id = r.hospital_id
     LEFT JOIN users coord ON coord.id = r.assigned_to
     WHERE r.id = $1 AND r.owner_user_id = $2 LIMIT 1`,
    [id, ownerId],
  );
  if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'Request not found');
  const history = (
    await db.query(
      `SELECT to_status, customer_message, created_at FROM request_status_history
       WHERE request_id = $1 ORDER BY created_at ASC`,
      [id],
    )
  ).rows.map((h) => ({ status: h.to_status, message: h.customer_message, at: h.created_at }));
  const policy = getCancellationPolicy(rows[0]);
  return {
    ...enrich(rows[0]),
    timeline: history,
    cancellable: policy.allowed,
    cancellation_policy: policy,
  };
}

// Dedicated separate API for rich request details & telemetry
export async function getCustomerRequestDetails(db, ownerId, id) {
  const req = await getCustomerRequest(db, ownerId, id);

  const coordName = req.coordinator?.name || null;
  const companionPhone = req.companion_phone || req.coordinator?.phone || null;
  const companionBadgeId = req.companion_badge_id || (coordName ? `AY-BHM-${String(req.assigned_to || '').slice(-4).toUpperCase()}` : null);

  const hospitalLead = req.hospital?.station_lead || {};
  const station = {
    manager: req.station_manager || hospitalLead.name || null,
    location: req.station_location || hospitalLead.desk || (req.hospital?.name ? `${req.hospital.name} Reception Desk` : null),
    intercom: req.station_intercom || hospitalLead.extension || null,
    phone: req.station_phone || hospitalLead.phone || req.hospital?.phone || null,
  };

  const doctorName = req.doctor_name || (req.appointment_type ? `Specialist (${req.appointment_type})` : null);
  const roomName = req.room_number || null;

  // Compute live step index based on status
  let currentStepIdx = 1;
  if (req.status === 'COMPLETED') currentStepIdx = 5;
  else if (req.status === 'SERVICE_IN_PROGRESS') currentStepIdx = 4;
  else if (req.status === 'SCHEDULED') currentStepIdx = 3;
  else if (req.status === 'CONFIRMED' || req.status === 'COORDINATION_IN_PROGRESS') currentStepIdx = 2;
  else currentStepIdx = 1;

  const formattedTime = req.schedule_at
    ? new Date(req.schedule_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : (req.appointment_date ? 'Standard Slot' : 'Pending Scheduling');

  const milestones = [
    {
      id: 1,
      title: 'Home Pickup & Transit Rendezvous',
      time: req.pickup_required ? 'At Doorstep Pickup' : 'At Hospital Arrival',
      status: currentStepIdx > 1 ? 'completed' : (currentStepIdx === 1 ? 'in_progress' : 'upcoming'),
      description: req.pickup_required
        ? `${req.pickup_address || 'Residence Doorstep'}. Wheelchair assistance & sanitised transit ride.`
        : 'Direct hospital rendezvous meeting scheduled at main reception.',
    },
    {
      id: 2,
      title: 'Hospital Arrival & Desk Rendezvous',
      time: formattedTime,
      status: currentStepIdx > 2 ? 'completed' : (currentStepIdx === 2 ? 'in_progress' : 'upcoming'),
      description: `${req.hospital?.name || 'Hospital'} Main Reception. Direct companion rendezvous with ${coordName || 'care companion'}.`,
    },
    {
      id: 3,
      title: 'Registration & Vitals Screening',
      time: 'OPD Intake',
      status: currentStepIdx > 3 ? 'completed' : (currentStepIdx === 3 ? 'in_progress' : 'upcoming'),
      description: 'Pre-consultation vitals recording, queue token generation, and physical file compilation.',
    },
    {
      id: 4,
      title: 'In-Hospital Navigation & Doctor Consult',
      time: 'In Consultation',
      status: currentStepIdx > 4 ? 'completed' : (currentStepIdx === 4 ? 'in_progress' : 'upcoming'),
      doctor: doctorName,
      room: roomName,
      description: doctorName && roomName
        ? `${coordName || 'Care Companion'} and ${req.recipient?.name || 'Patient'} attending consultation in ${roomName} with ${doctorName}.`
        : doctorName
        ? `${coordName || 'Care Companion'} and ${req.recipient?.name || 'Patient'} consultation scheduled with ${doctorName}.`
        : `${coordName || 'Care Companion'} and ${req.recipient?.name || 'Patient'} in-hospital consultation with attending physician.`,
    },
    {
      id: 5,
      title: 'Pharmacy Pickup & Care Dossier Handover',
      time: 'Conclusion',
      status: currentStepIdx === 5 ? 'completed' : 'upcoming',
      description: 'Prescription dispensation, pharmacy verification, and post-visit dossier archiving.',
    },
  ];

  return {
    ...req,
    doctor_name: doctorName,
    room_number: roomName,
    companion: coordName ? {
      name: coordName,
      phone: companionPhone,
      badge_id: companionBadgeId,
      role: 'Care Companion',
      escorts_count: null,
      verified: true,
    } : null,
    station,
    current_step: currentStepIdx,
    milestones,
    telemetry: req.telemetry_data || null,
  };
}

function parseDateValue(val, defaultTime = '00:00:00') {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val === 'string') {
    const s = val.trim();
    const d = new Date(s.includes('T') ? s : `${s}T${defaultTime}`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function getCancellationPolicy(req) {
  const now = Date.now();
  const status = req?.status;

  if (status === 'CANCELLED') {
    return {
      allowed: false,
      requires_support: false,
      reason: 'This request is already cancelled.',
      policy: 'ALREADY_CANCELLED',
    };
  }
  if (status === 'COMPLETED') {
    return {
      allowed: false,
      requires_support: false,
      reason: 'This care request has already been completed.',
      policy: 'ALREADY_COMPLETED',
    };
  }
  if (status === 'SERVICE_IN_PROGRESS') {
    return {
      allowed: false,
      requires_support: true,
      reason: 'Care escort is active on ground with the patient. Direct cancellation is locked. Please contact Customer Care for urgent assistance.',
      policy: 'IN_PROGRESS',
    };
  }

  // 1. After confirming appointment (CONFIRMED or SCHEDULED)
  if (status === 'CONFIRMED' || status === 'SCHEDULED') {
    const target = parseDateValue(req.schedule_at) || parseDateValue(req.appointment_date, '09:00:00');

    if (!target) {
      return {
        allowed: true,
        requires_support: false,
        reason: 'Confirmed appointment can be cancelled up to 6 hours before the scheduled slot.',
        policy: 'CONFIRMED_6HR',
      };
    }

    const diffHours = (target.getTime() - now) / (1000 * 60 * 60);
    if (diffHours >= 6) {
      return {
        allowed: true,
        requires_support: false,
        hours_remaining: Math.round(diffHours * 10) / 10,
        reason: `Appointment confirmed. You can cancel up to 6 hours before the scheduled slot (${Math.max(0, Math.round(diffHours - 6))} hours remaining to auto-cancel).`,
        policy: 'CONFIRMED_6HR',
      };
    } else {
      return {
        allowed: false,
        requires_support: true,
        hours_remaining: Math.max(0, Math.round(diffHours * 10) / 10),
        reason: 'Appointment is scheduled within 6 hours. Automatic cancellation is locked. Please contact customer care with request details to process urgent cancellation.',
        policy: 'CONFIRMED_6HR_LOCKED',
      };
    }
  }

  // 2. Without confirming appointment details (REQUEST_RECEIVED, UNDER_REVIEW, COORDINATION_IN_PROGRESS, ACTION_REQUIRED)
  const targetDate = parseDateValue(req.appointment_date, '00:00:00') || parseDateValue(req.schedule_at);

  if (!targetDate) {
    return {
      allowed: true,
      requires_support: false,
      reason: 'Unconfirmed requests can be cancelled up to 3 days before the requested visit date.',
      policy: 'UNCONFIRMED_3DAY',
    };
  }

  const diffHours = (targetDate.getTime() - now) / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  if (diffHours >= 72) {
    return {
      allowed: true,
      requires_support: false,
      days_remaining: Math.round(diffDays * 10) / 10,
      reason: `Appointment not yet confirmed. You can cancel up to 3 days before the requested visit date (${Math.max(0, Math.round(diffDays - 3))} days remaining to auto-cancel).`,
      policy: 'UNCONFIRMED_3DAY',
    };
  } else {
    return {
      allowed: false,
      requires_support: true,
      days_remaining: Math.max(0, Math.round(diffDays * 10) / 10),
      reason: 'Requested appointment date is within 3 days. Automatic cancellation is locked. Please contact customer care with request details to cancel.',
      policy: 'UNCONFIRMED_3DAY_LOCKED',
    };
  }
}

export async function cancelCustomerRequest(db, actor, id) {
  const current = await getCustomerRequest(db, actor.actorId, id);
  const policy = getCancellationPolicy(current);
  if (!policy.allowed) {
    throw httpError(409, 'REQUEST_NOT_CANCELLABLE', policy.reason);
  }
  await db.query(`UPDATE requests SET status = 'CANCELLED', cancelled_at = now(), updated_at = now() WHERE id = $1`, [id]);
  await db.query(
    `INSERT INTO request_status_history (request_id, from_status, to_status, customer_message)
     VALUES ($1, $2, 'CANCELLED', 'You cancelled this request.')`,
    [id, current.status],
  );
  await recordAudit(db, { ...actor, action: 'REQUEST_CANCELLED', entityType: 'requests', entityId: id, metadata: { from: current.status } });
  return getCustomerRequest(db, actor.actorId, id);
}

