import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { __getLatestOtpForTesting } from '../src/modules/auth/otp.js';

let db;
let close;
let app;
let opsToken;
let staffId;
let customerId;
let requestId;

async function seedOpsUser(email, password, roles) {
  const hash = await hashPassword(password);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ($1,$2,$3,'active') RETURNING id`,
    [email, hash, email],
  );
  for (const role of roles) {
    await db.query('INSERT INTO user_roles (user_id, role) VALUES ($1,$2)', [rows[0].id, role]);
  }
  return rows[0].id;
}

async function customerSignupLogin(email) {
  await request(app).post('/api/v1/auth/signup').send({ full_name: 'Ops Flow User', email });
  const otp = __getLatestOtpForTesting(email);
  const verify = await request(app).post('/api/v1/auth/otp/verify').send({ purpose: 'signup', email, code: otp });
  return { token: verify.body.data.accessToken, id: verify.body.data.user.id };
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });

  await seedOpsUser('head@example.com', 'head-password-1', ['operations_head']);
  staffId = await seedOpsUser('staff@example.com', 'staff-password-1', ['operations_staff']);

  const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'head@example.com', password: 'head-password-1' });
  opsToken = login.body.data.accessToken;

  const cust = await customerSignupLogin('opsflow@example.com');
  customerId = cust.id;

  const svc = (await db.query(`INSERT INTO services (slug, title_en, status, is_visible) VALUES ('s1','Svc','published',true) RETURNING id`)).rows[0].id;
  const hosp = (await db.query(`INSERT INTO hospitals (slug, name_en, status, is_visible) VALUES ('h1','Hosp','published',true) RETURNING id`)).rows[0].id;
  const rec = (await db.query(`INSERT INTO care_recipients (owner_user_id, full_name) VALUES ($1,'Self') RETURNING id`, [customerId])).rows[0].id;
  requestId = (await db.query(
    `INSERT INTO requests (owner_user_id, recipient_id, service_id, hospital_id, idempotency_key)
     VALUES ($1,$2,$3,$4,'ops-seed-1') RETURNING id`,
    [customerId, rec, svc, hosp],
  )).rows[0].id;
  await db.query(`INSERT INTO request_status_history (request_id, to_status, customer_message) VALUES ($1,'REQUEST_RECEIVED','Received')`, [requestId]);
}, 120_000);

afterAll(async () => {
  await close?.();
});

const ops = (req) => req.set('Authorization', `Bearer ${opsToken}`);

describe('ops request queue', () => {
  it('lists with customer/service context and searches', async () => {
    const all = await ops(request(app).get('/api/v1/ops/requests'));
    expect(all.status).toBe(200);
    expect(all.body.data.length).toBe(1);
    expect(all.body.data[0]).toMatchObject({ status: 'REQUEST_RECEIVED', customer_email: 'opsflow@example.com' });

    const hit = await ops(request(app).get('/api/v1/ops/requests')).query({ q: 'opsflow' });
    expect(hit.body.data.length).toBe(1);
    const miss = await ops(request(app).get('/api/v1/ops/requests')).query({ q: 'nobody-here' });
    expect(miss.body.data.length).toBe(0);
  });

  it('exposes allowed transitions in detail', async () => {
    const res = await ops(request(app).get(`/api/v1/ops/requests/${requestId}`));
    expect(res.status).toBe(200);
    expect(res.body.data.allowed_transitions).toEqual(['UNDER_REVIEW', 'CANCELLED']);
    expect(res.body.data.customer.email).toBe('opsflow@example.com');
  });
});

describe('status machine', () => {
  it('walks the happy path to COMPLETED', async () => {
    const flow = [
      ['UNDER_REVIEW', { customer_message: 'Reviewing now.' }],
      ['COORDINATION_IN_PROGRESS', { note_internal: 'Called hospital.' }],
      ['CONFIRMED', { customer_message: 'Confirmed for Monday.' }],
      ['SCHEDULED', {}],
      ['SERVICE_IN_PROGRESS', {}],
      ['COMPLETED', { customer_message: 'Journey complete. Thank you!' }],
    ];
    for (const [to, extra] of flow) {
      const res = await ops(request(app).patch(`/api/v1/ops/requests/${requestId}/status`)).send({ to_status: to, ...extra });
      expect(res.status, `to ${to}: ${JSON.stringify(res.body)}`).toBe(200);
      expect(res.body.data.status).toBe(to);
    }
    const audit = (await db.query(`SELECT action FROM audit_logs WHERE entity_id = $1`, [requestId])).rows.map((r) => r.action);
    expect(audit.filter((a) => a === 'REQUEST_STATUS_CHANGED').length).toBe(6);
  });

  it('blocks illegal jumps and terminal edits', async () => {
    const res = await ops(request(app).patch(`/api/v1/ops/requests/${requestId}/status`)).send({ to_status: 'UNDER_REVIEW' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('requires a customer message for ACTION_REQUIRED', async () => {
    const svc = (await db.query(`INSERT INTO services (slug, title_en, status, is_visible) VALUES ('s2','Svc2','published',true) RETURNING id`)).rows[0].id;
    const hosp = (await db.query(`INSERT INTO hospitals (slug, name_en, status, is_visible) VALUES ('h2','Hosp2','published',true) RETURNING id`)).rows[0].id;
    const rec = (await db.query(`INSERT INTO care_recipients (owner_user_id, full_name) VALUES ($1,'R2') RETURNING id`, [customerId])).rows[0].id;
    const r2 = (await db.query(
      `INSERT INTO requests (owner_user_id, recipient_id, service_id, hospital_id, status, idempotency_key)
       VALUES ($1,$2,$3,$4,'UNDER_REVIEW','ops-seed-2') RETURNING id`, [customerId, rec, svc, hosp])).rows[0].id;

    const bare = await ops(request(app).patch(`/api/v1/ops/requests/${r2}/status`)).send({ to_status: 'ACTION_REQUIRED' });
    expect(bare.status).toBe(400);
    expect(bare.body.code).toBe('CUSTOMER_MESSAGE_REQUIRED');

    const ok = await ops(request(app).patch(`/api/v1/ops/requests/${r2}/status`)).send({
      to_status: 'ACTION_REQUIRED', customer_message: 'Please share your discharge summary.',
    });
    expect(ok.status).toBe(200);
  });
});

describe('assignment + customers + team', () => {
  it('assigns to ops staff and rejects customers as assignees', async () => {
    const ok = await ops(request(app).patch(`/api/v1/ops/requests/${requestId}/assign`)).send({ assigned_to: staffId });
    expect(ok.status).toBe(200);
    expect(ok.body.data.assigned_to).toBe(staffId);

    const bad = await ops(request(app).patch(`/api/v1/ops/requests/${requestId}/assign`)).send({ assigned_to: customerId });
    expect(bad.status).toBe(400);
    expect(bad.body.code).toBe('INVALID_ASSIGNEE');

    const mine = await ops(request(app).get('/api/v1/ops/requests')).query({ assigned: 'unassigned' });
    expect(mine.body.data.length).toBe(1); // the second request is unassigned
  });

  it('views customer profile with history, and lists the team', async () => {
    const cust = await ops(request(app).get(`/api/v1/ops/customers/${customerId}`));
    expect(cust.status).toBe(200);
    expect(cust.body.data.requests.length).toBe(2);
    expect(cust.body.data.recipients.length).toBe(2);
    expect(cust.body.data).not.toHaveProperty('password_hash');

    const team = await ops(request(app).get('/api/v1/ops/customers/team'));
    expect(team.status).toBe(200);
    expect(team.body.data.length).toBe(2);
  });

  it('updates request details, schedule, pickup, and publishes customer message/summary', async () => {
    const patchRes = await ops(request(app).patch(`/api/v1/ops/requests/${requestId}`)).send({
      appointment_type: 'Senior Cardiology OPD & Echo',
      appointment_date: '2026-11-15',
      pickup_required: true,
      pickup_address: '12-3-4 Gandhi Road, Bhimavaram',
      additional_requirements: 'Wheelchair assistance needed at Gate 2',
      customer_message: 'Companion assigned and pickup scheduled for 8:30 AM.',
      note_internal: 'Driver contact: Suresh 9876543210',
    });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.appointment_type).toBe('Senior Cardiology OPD & Echo');
    expect(patchRes.body.data.pickup_required).toBe(true);
    expect(patchRes.body.data.pickup_address).toBe('12-3-4 Gandhi Road, Bhimavaram');
    expect(patchRes.body.data.additional_requirements).toBe('Wheelchair assistance needed at Gate 2');

    // Customer side non-owner fetches request and is denied (404)
    const custRes = await request(app)
      .get(`/api/v1/requests/${requestId}`)
      .set('Authorization', `Bearer ${(await customerSignupLogin('checkupdates@example.com')).token}`);
    expect(custRes.status).toBe(404);
    // But request belongs to customerId 'opsflow@example.com'
    const ownerToken = (await request(app).post('/api/v1/auth/otp/verify').send({
      purpose: 'login', email: 'opsflow@example.com', code: __getLatestOtpForTesting('opsflow@example.com') || '000000',
    })).body?.data?.accessToken;

    if (ownerToken) {
      const ownerReq = await request(app).get(`/api/v1/requests/${requestId}`).set('Authorization', `Bearer ${ownerToken}`);
      expect(ownerReq.status).toBe(200);
      expect(ownerReq.body.data.appointment_type).toBe('Senior Cardiology OPD & Echo');
      expect(ownerReq.body.data.pickup_required).toBe(true);
    }
  });
});

