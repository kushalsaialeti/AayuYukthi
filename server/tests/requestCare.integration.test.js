import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { __getLatestOtpForTesting } from '../src/modules/auth/otp.js';

let db;
let close;
let app;
let tokenA;
let tokenB;
let recipientA;
let serviceId;
let hospitalId;
const DRAFT_KEY = 'test-draft-key-001';

async function signupLogin(email) {
  await request(app).post('/api/v1/auth/signup').send({ full_name: 'Req User', email });
  const otp = __getLatestOtpForTesting(email);
  const verify = await request(app).post('/api/v1/auth/otp/verify').send({
    purpose: 'signup', email, code: otp,
  });
  return verify.body.data.accessToken;
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  tokenA = await signupLogin('req-a@example.com');
  tokenB = await signupLogin('req-b@example.com');

  serviceId = (await db.query(
    `INSERT INTO services (slug, title_en, status, is_visible) VALUES ('svc-a','Service A','published',true) RETURNING id`)).rows[0].id;
  hospitalId = (await db.query(
    `INSERT INTO hospitals (slug, name_en, city, status, is_visible) VALUES ('hosp-a','Hospital A','Vijayawada','published',true) RETURNING id`)).rows[0].id;
  await db.query(`INSERT INTO hospital_services (hospital_id, service_id) VALUES ($1,$2)`, [hospitalId, serviceId]);

  const rec = await request(app).post('/api/v1/account/recipients')
    .set('Authorization', `Bearer ${tokenA}`).send({ full_name: 'Self', relationship: 'self' });
  recipientA = rec.body.data.id;
}, 120_000);

afterAll(async () => {
  await close?.();
});

const auth = (req, token = tokenA) => req.set('Authorization', `Bearer ${token}`);

const validPayload = () => ({
  idempotency_key: DRAFT_KEY,
  recipient_id: recipientA,
  service_id: serviceId,
  hospital_id: hospitalId,
  appointment_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  pickup_required: true,
  pickup_address: '12 Main Road, Vijayawada',
  additional_requirements: 'Wheelchair assistance',
});

describe('draft persistence', () => {
  it('saves and resumes wizard state', async () => {
    const save = await auth(request(app).put('/api/v1/requests/draft')).send({
      idempotency_key: DRAFT_KEY, current_step: 3,
      payload: { recipient_id: recipientA, service_id: serviceId },
    });
    expect(save.status).toBe(200);
    expect(save.body.data.current_step).toBe(3);

    const resumed = await auth(request(app).get('/api/v1/requests/draft')).query({ idempotency_key: DRAFT_KEY });
    expect(resumed.body.data.payload.service_id).toBe(serviceId);
  });

  it('returns null for unknown draft keys', async () => {
    const res = await auth(request(app).get('/api/v1/requests/draft')).query({ idempotency_key: 'nope' });
    expect(res.body.data).toBeNull();
  });
});

describe('submit validation', () => {
  it('rejects another customer\u2019s recipient', async () => {
    const res = await auth(request(app).post('/api/v1/requests/submit'), tokenB).send({ ...validPayload(), idempotency_key: 'k-bad-recipient' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_RECIPIENT');
  });

  it('rejects pickup without an address', async () => {
    const res = await auth(request(app).post('/api/v1/requests/submit')).send({
      ...validPayload(), idempotency_key: 'k-no-pickup-addr', pickup_address: null,
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects past appointment dates', async () => {
    const res = await auth(request(app).post('/api/v1/requests/submit')).send({
      ...validPayload(), idempotency_key: 'k-past-date', appointment_date: '2020-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('rejects unpublished services', async () => {
    const draft = (await db.query(
      `INSERT INTO services (slug, title_en, status, is_visible) VALUES ('svc-draft','Draft Svc','draft',true) RETURNING id`)).rows[0].id;
    const res = await auth(request(app).post('/api/v1/requests/submit')).send({
      ...validPayload(), idempotency_key: 'k-draft-svc', service_id: draft,
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_SERVICE');
  });
});

describe('submit + idempotency + reads', () => {
  let requestId;

  it('submits, clears the draft, and writes the received history + audit', async () => {
    const res = await auth(request(app).post('/api/v1/requests/submit')).send(validPayload());
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('REQUEST_RECEIVED');
    requestId = res.body.data.id;

    const draft = await auth(request(app).get('/api/v1/requests/draft')).query({ idempotency_key: DRAFT_KEY });
    expect(draft.body.data).toBeNull();

    const { rows } = await db.query(`SELECT action FROM audit_logs WHERE entity_id = $1`, [requestId]);
    expect(rows.map((r) => r.action)).toContain('REQUEST_SUBMITTED');
  });

  it('returns the existing request on duplicate submit (no double record)', async () => {
    const res = await auth(request(app).post('/api/v1/requests/submit')).send(validPayload());
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(requestId);
    expect(res.body.data.duplicate).toBe(true);

    const count = (await db.query('SELECT COUNT(*)::int AS c FROM requests')).rows[0].c;
    expect(count).toBe(1);
  });

  it('lists and details are owner-scoped and hide internal notes', async () => {
    await db.query(
      `INSERT INTO request_status_history (request_id, from_status, to_status, note_internal, customer_message)
       VALUES ($1, 'REQUEST_RECEIVED', 'UNDER_REVIEW', 'SECRET-INTERNAL', 'We are reviewing your request.')`,
      [requestId],
    );
    await db.query(`UPDATE requests SET status = 'UNDER_REVIEW' WHERE id = $1`, [requestId]);

    const list = await auth(request(app).get('/api/v1/requests'), tokenB);
    expect(list.body.data).toEqual([]);

    const detail = await auth(request(app).get(`/api/v1/requests/${requestId}`));
    expect(detail.status).toBe(200);
    expect(JSON.stringify(detail.body)).not.toContain('SECRET-INTERNAL');
    expect(detail.body.data.timeline.at(-1)).toMatchObject({ status: 'UNDER_REVIEW', message: 'We are reviewing your request.' });
    expect(detail.body.data.service.title).toBe('Service A');
  });

  it('cancels from an early state (>3 days) and blocks cancel when already cancelled', async () => {
    const cancelled = await auth(request(app).post(`/api/v1/requests/${requestId}/cancel`));
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.status).toBe('CANCELLED');

    const again = await auth(request(app).post(`/api/v1/requests/${requestId}/cancel`));
    expect(again.status).toBe(409);
    expect(again.body.code).toBe('REQUEST_NOT_CANCELLABLE');
  });

  it('blocks cancellation for unconfirmed requests within 3 days', async () => {
    // Submit request with date 1 day from now (< 3 days)
    const soonDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const sub = await auth(request(app).post('/api/v1/requests/submit')).send({
      ...validPayload(),
      idempotency_key: 'test-soon-cancellation-001',
      appointment_date: soonDate,
    });
    expect(sub.status).toBe(201);
    const soonId = sub.body.data.id;

    const cancelRes = await auth(request(app).delete(`/api/v1/requests/${soonId}`));
    expect(cancelRes.status).toBe(409);
    expect(cancelRes.body.code).toBe('REQUEST_NOT_CANCELLABLE');
    expect(cancelRes.body.message).toContain('within 3 days');
  });

  it('allows cancellation for confirmed appointments > 6 hours and blocks < 6 hours', async () => {
    // 1. Confirmed request with appointment in 10 hours (> 6 hours)
    const futureSlot = new Date(Date.now() + 10 * 3600000).toISOString();
    const sub1 = await auth(request(app).post('/api/v1/requests/submit')).send({
      ...validPayload(),
      idempotency_key: 'test-confirmed-10h',
    });
    const id1 = sub1.body.data.id;
    await db.query(`UPDATE requests SET status = 'CONFIRMED', schedule_at = $1 WHERE id = $2`, [futureSlot, id1]);

    const cancel1 = await auth(request(app).delete(`/api/v1/requests/${id1}`));
    expect(cancel1.status).toBe(200);
    expect(cancel1.body.data.status).toBe('CANCELLED');

    // 2. Confirmed request with appointment in 2 hours (< 6 hours)
    const urgentSlot = new Date(Date.now() + 2 * 3600000).toISOString();
    const sub2 = await auth(request(app).post('/api/v1/requests/submit')).send({
      ...validPayload(),
      idempotency_key: 'test-confirmed-2h',
    });
    const id2 = sub2.body.data.id;
    await db.query(`UPDATE requests SET status = 'CONFIRMED', schedule_at = $1 WHERE id = $2`, [urgentSlot, id2]);

    const cancel2 = await auth(request(app).delete(`/api/v1/requests/${id2}`));
    expect(cancel2.status).toBe(409);
    expect(cancel2.body.code).toBe('REQUEST_NOT_CANCELLABLE');
    expect(cancel2.body.message).toContain('within 6 hours');
  });
});
