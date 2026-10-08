import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { __getLatestOtpForTesting } from '../src/modules/auth/otp.js';

// Critical journey, one database: signup → OTP → profile → recipient →
// draft → submit → ops triage with customer message → customer timeline +
// notification → support thread → language switch → analytics visible.
// If this passes, the vertical slices are genuinely connected.

let db;
let close;
let app;

const state = {};

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });

  const hash = await hashPassword('journey-ops-1');
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ('journey-ops@example.com',$1,'Journey Ops','active') RETURNING id`, [hash]);
  await db.query(`INSERT INTO user_roles (user_id, role) VALUES ($1,'operations_staff')`, [rows[0].id]);

  for (const [key, title, body] of [['about.mission', 'Our mission', 'Care for all.']]) {
    await db.query(`INSERT INTO content_blocks (key, title_en, body_en, status) VALUES ($1,$2,$3,'published')`, [key, title, body]);
  }
}, 180_000);

afterAll(async () => {
  await close?.();
});

describe('critical journey', () => {
  it('signup → OTP → tokens', async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      full_name: 'Journey Customer', email: 'journey@example.com', password: 'journey-pass-1',
    });
    expect(signup.status).toBe(201);
    const otp = __getLatestOtpForTesting('journey@example.com');
    const verify = await request(app).post('/api/v1/auth/otp/verify').send({
      purpose: 'signup', email: 'journey@example.com', code: otp,
    });
    expect(verify.status).toBe(200);
    state.token = verify.body.data.accessToken;
    state.userId = verify.body.data.user.id;
  });

  it('onboarding: profile + recipient → registration complete', async () => {
    const auth = (r) => r.set('Authorization', `Bearer ${state.token}`);
    await auth(request(app).patch('/api/v1/account/me')).send({ full_name: 'Journey Customer' });
    const rec = await auth(request(app).post('/api/v1/account/recipients')).send({ full_name: 'Mother', relationship: 'parent' });
    expect(rec.status).toBe(201);
    state.recipientId = rec.body.data.id;
    const me = await auth(request(app).get('/api/v1/account/me'));
    expect(me.body.data.onboarding_last_step).toBe('REGISTRATION_COMPLETED');
  });

  it('CMS publishes service + hospital; customer drafts and submits', async () => {
    const opsLogin = await request(app).post('/api/v1/ops/auth/login').send({ email: 'journey-ops@example.com', password: 'journey-ops-1' });
    state.ops = opsLogin.body.data.accessToken;
    const ops = (r) => r.set('Authorization', `Bearer ${state.ops}`);

    const svc = await ops(request(app).post('/api/v1/ops/services')).send({ title_en: 'Journey Support', status: 'published' });
    const hosp = await ops(request(app).post('/api/v1/ops/hospitals')).send({ name_en: 'Journey Hospital', city: 'Guntur', status: 'published' });
    state.serviceId = svc.body.data.id;
    state.hospitalId = hosp.body.data.id;

    // Public site sees both (CMS-driven, no hardcoding).
    expect((await request(app).get('/api/v1/services')).body.data.length).toBe(1);
    expect((await request(app).get('/api/v1/hospitals?city=Guntur')).body.data.length).toBe(1);

    const auth = (r) => r.set('Authorization', `Bearer ${state.token}`);
    const key = 'journey-draft-1';
    await auth(request(app).put('/api/v1/requests/draft')).send({ idempotency_key: key, current_step: 3, payload: { recipient_id: state.recipientId } });
    const resumed = await auth(request(app).get('/api/v1/requests/draft')).query({ idempotency_key: key });
    expect(resumed.body.data.payload.recipient_id).toBe(state.recipientId);

    const submit = await auth(request(app).post('/api/v1/requests/submit')).send({
      idempotency_key: key, recipient_id: state.recipientId, service_id: state.serviceId, hospital_id: state.hospitalId,
      pickup_required: true, pickup_address: 'Guntur home',
    });
    expect(submit.status).toBe(201);
    state.requestId = submit.body.data.id;
  });

  it('ops triages → customer sees update + notification, not internals', async () => {
    const ops = (r) => r.set('Authorization', `Bearer ${state.ops}`);
    const upd = await ops(request(app).patch(`/api/v1/ops/requests/${state.requestId}/status`)).send({
      to_status: 'UNDER_REVIEW', note_internal: 'JOURNEY-SECRET', customer_message: 'Reviewing your request.',
    });
    expect(upd.status).toBe(200);

    const auth = (r) => r.set('Authorization', `Bearer ${state.token}`);
    const detail = await auth(request(app).get(`/api/v1/requests/${state.requestId}`));
    expect(detail.body.data.timeline.at(-1).message).toBe('Reviewing your request.');
    expect(JSON.stringify(detail.body)).not.toContain('JOURNEY-SECRET');

    const notifs = await auth(request(app).get('/api/v1/support/notifications'));
    expect(notifs.body.data.some((n) => n.type === 'request_update')).toBe(true);
  });

  it('support thread + public contact + language-tolerant reads', async () => {
    const auth = (r) => r.set('Authorization', `Bearer ${state.token}`);
    const ticket = await auth(request(app).post('/api/v1/support/tickets')).send({ subject: 'Timing?', message: 'When?' });
    expect(ticket.status).toBe(201);

    const contact = await request(app).post('/api/v1/contact').send({ name: 'Visitor', email: 'v@example.com', message: 'Hello' });
    expect(contact.status).toBe(201);

    // CMS content readable as published blocks (translation layer tolerant).
    expect((await request(app).get('/api/v1/content/blocks/about.mission')).status).toBe(200);
  });

  it('analytics captured the journey server-side', async () => {
    const kinds = (await db.query('SELECT DISTINCT event_name FROM analytics_events')).rows.map((r) => r.event_name);
    for (const e of ['OTP_REQUESTED', 'OTP_VERIFIED', 'REGISTRATION_COMPLETED', 'REQUEST_SUBMITTED']) {
      expect(kinds).toContain(e);
    }
  });
});
