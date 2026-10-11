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

const ACTIVE_STATUS_LIST = [
  'REQUEST_RECEIVED',
  'UNDER_REVIEW',
  'COORDINATION_IN_PROGRESS',
  'CONFIRMED',
  'SCHEDULED',
  'SERVICE_IN_PROGRESS',
  'ACTION_REQUIRED',
];

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

export async function listCustomerDrafts(db, ownerId) {
  const { rows } = await db.query(
    `SELECT d.id, d.idempotency_key, d.current_step, d.payload, d.created_at, d.updated_at,
            rec.id AS valid_recipient_id,
            rec.full_name AS recipient_name, rec.relationship AS recipient_relationship,
            s.id AS valid_service_id, s.title_en AS service_title,
            h.id AS valid_hospital_id, h.name_en AS hospital_name,
            (SELECT COUNT(*)::int FROM requests r
             WHERE (d.payload->>'recipient_id') IS NOT NULL
               AND (d.payload->>'recipient_id') ~ '^[0-9a-fA-F-]{36}$'
               AND r.recipient_id = (d.payload->>'recipient_id')::uuid
               AND r.status = ANY($2::text[])) AS recipient_active_count
     FROM request_drafts d
     LEFT JOIN care_recipients rec ON (d.payload->>'recipient_id') IS NOT NULL
          AND (d.payload->>'recipient_id') ~ '^[0-9a-fA-F-]{36}$'
          AND rec.id = (d.payload->>'recipient_id')::uuid
          AND rec.owner_user_id = $1
     LEFT JOIN services s ON (d.payload->>'service_id') IS NOT NULL
          AND (d.payload->>'service_id') ~ '^[0-9a-fA-F-]{36}$'
          AND s.id = (d.payload->>'service_id')::uuid
     LEFT JOIN hospitals h ON (d.payload->>'hospital_id') IS NOT NULL
          AND (d.payload->>'hospital_id') ~ '^[0-9a-fA-F-]{36}$'
          AND h.id = (d.payload->>'hospital_id')::uuid
     WHERE d.owner_user_id = $1
     ORDER BY d.updated_at DESC`,
    [ownerId, ACTIVE_STATUS_LIST],
  );
  return rows.map((r) => {
    const hasRecipient = Boolean(r.valid_recipient_id);
    const hasService = Boolean(r.valid_service_id);
    const hasHospital = Boolean(r.valid_hospital_id);
    const isComplete = hasRecipient && hasService && hasHospital;

    const missing = [];
    if (!hasRecipient) missing.push(r.payload?.recipient_id ? 'Care recipient profile no longer exists' : 'Care recipient not selected');
    if (!hasService) missing.push('Care service not selected');
    if (!hasHospital) missing.push('Hospital campus not selected');

    return {
      id: r.id,
      idempotency_key: r.idempotency_key,
      current_step: r.current_step,
      payload: r.payload,
      created_at: r.created_at,
      updated_at: r.updated_at,
      recipient_name: r.recipient_name || (r.payload?.recipient_id ? 'Unknown recipient' : 'No patient selected'),
      recipient_relationship: r.recipient_relationship,
      service_title: r.service_title || 'No service selected',
      hospital_name: r.hospital_name || 'No hospital selected',
      has_active_request: (r.recipient_active_count || 0) > 0,
      is_complete: isComplete,
      missing_fields: missing,
      is_queued: Boolean(r.payload?.is_queued_draft),
    };
  });
}

export async function deleteDraft(db, ownerId, draftId) {
  const { rowCount } = await db.query(
    'DELETE FROM request_drafts WHERE id = $1 AND owner_user_id = $2',
    [draftId, ownerId],
  );
  if (!rowCount) throw httpError(404, 'DRAFT_NOT_FOUND', 'Draft not found');
  return { success: true };
}

export async function activateDraft(db, actor, draftId) {
  const ownerId = actor.actorId;
  const { rows } = await db.query(
    'SELECT id, idempotency_key, payload FROM request_drafts WHERE id = $1 AND owner_user_id = $2 LIMIT 1',
    [draftId, ownerId],
  );
  if (!rows[0]) throw httpError(404, 'DRAFT_NOT_FOUND', 'Draft not found');

  const payload = rows[0].payload;
  if (!payload) {
    throw httpError(400, 'INCOMPLETE_DRAFT', 'This draft is empty. Please complete the booking form.');
  }
  if (!payload.recipient_id) {
    throw httpError(400, 'INCOMPLETE_DRAFT', 'This draft is missing a care recipient. Please resume the booking to select a patient.');
  }
  if (!payload.service_id) {
    throw httpError(400, 'INCOMPLETE_DRAFT', 'This draft is missing the requested care service. Please resume the booking to select a service.');
  }
  if (!payload.hospital_id) {
    throw httpError(400, 'INCOMPLETE_DRAFT', 'This draft is missing the destination hospital. Please resume the booking to select a hospital.');
  }

  // Check if recipient still has an active request
  const active = await db.query(
    `SELECT id, status FROM requests WHERE recipient_id = $1 AND status = ANY($2::text[]) LIMIT 1`,
    [payload.recipient_id, ACTIVE_STATUS_LIST],
  );
  if (active.rows[0]) {
    throw httpError(409, 'ACTIVE_REQUEST_EXISTS', 'This care recipient still has an ongoing active request. You can push this draft to live once their current request completes.');
  }

  // Submit as live request with a fresh live activation key
  const submitKey = `live-${draftId}-${Date.now()}`;
  const submitResult = await submitRequest(db, actor, {
    ...payload,
    idempotency_key: submitKey,
  });

  if (!submitResult.saved_as_draft) {
    await db.query('DELETE FROM request_drafts WHERE id = $1', [draftId]);
  }

  return submitResult;
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

  // Rule: Max 1 active request per recipient. Second request sent to drafts.
  const activeExisting = await db.query(
    `SELECT id, status, appointment_date FROM requests
     WHERE recipient_id = $1 AND status = ANY($2::text[])
     LIMIT 1`,
    [input.recipient_id, ACTIVE_STATUS_LIST],
  );
  if (activeExisting.rows[0]) {
    const draftKey = input.idempotency_key || `draft-${Date.now()}`;
    const savedDraft = await saveDraft(db, ownerId, {
      idempotency_key: draftKey,
      current_step: 7,
      payload: {
        ...input,
        is_queued_draft: true,
        active_request_id: activeExisting.rows[0].id,
      },
    });
    return {
      saved_as_draft: true,
      active_request_id: activeExisting.rows[0].id,
      draft: savedDraft,
      message: 'This care recipient already has an active request in progress. This booking has been saved to your drafts and can be pushed to a live request once the active request completes.',
    };
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

// Dedicated receipt API endpoint
export async function getCustomerRequestReceipt(db, ownerId, id) {
  const req = await getCustomerRequest(db, ownerId, id);
  return {
    ...req,
    receipt_generated_at: new Date().toISOString(),
    caretaker_note: 'The care companion / caretaker details will be shared 1 hour before the scheduled service request time.',
    consent_recorded: {
      privacy_policy_accepted: true,
      terms_and_conditions_accepted: true,
    },
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

