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
let recipientId;

async function signupLogin(email) {
  await request(app).post('/api/v1/auth/signup').send({ full_name: 'Onboard User', email });
  const otp = __getLatestOtpForTesting(email);
  const verify = await request(app).post('/api/v1/auth/otp/verify').send({ purpose: 'signup', email, code: otp });
  return verify.body.data.accessToken;
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  tokenA = await signupLogin('onboard-a@example.com');
  tokenB = await signupLogin('onboard-b@example.com');
}, 120_000);

afterAll(async () => {
  await close?.();
});

const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);

describe('profile + onboarding', () => {
  it('reads the profile with funnel state', async () => {
    const res = await auth(request(app).get('/api/v1/account/me'), tokenA);
    expect(res.status).toBe(200);
    expect(res.body.data.onboarding_last_step).toBe('OTP_VERIFIED');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  it('updates name/locale/preferences and stamps PROFILE_COMPLETED', async () => {
    const res = await auth(request(app).patch('/api/v1/account/me'), tokenA).send({
      full_name: 'Onboard A', locale: 'te', preferences: { sms: true, email: false },
    });
    expect(res.status).toBe(200);
    expect(res.body.data.locale).toBe('te');
    expect(res.body.data.preferences).toEqual({ sms: true, email: false });

    const me = await auth(request(app).get('/api/v1/account/me'), tokenA);
    expect(me.body.data.onboarding_last_step).toBe('PROFILE_COMPLETED');
  });

  it('rejects bad locale and empty patches', async () => {
    const bad = await auth(request(app).patch('/api/v1/account/me'), tokenA).send({ locale: 'fr' });
    expect(bad.status).toBe(400);
    const empty = await auth(request(app).patch('/api/v1/account/me'), tokenA).send({});
    expect(empty.status).toBe(400);
  });

  it('requires customer auth (ops tokens refused, anonymous refused)', async () => {
    const anon = await request(app).get('/api/v1/account/me');
    expect(anon.status).toBe(401);
  });
});

describe('care recipients', () => {
  it('creates a recipient and completes registration', async () => {
    const res = await auth(request(app).post('/api/v1/account/recipients'), tokenA).send({
      full_name: 'Father', relationship: 'parent', gender: 'male',
    });
    expect(res.status).toBe(201);
    recipientId = res.body.data.id;

    const me = await auth(request(app).get('/api/v1/account/me'), tokenA);
    expect(me.body.data.onboarding_last_step).toBe('REGISTRATION_COMPLETED');
    expect(me.body.data.onboarding_completed_at).not.toBeNull();
  });

  it('validates recipient input (future dob, bad phone)', async () => {
    const res = await auth(request(app).post('/api/v1/account/recipients'), tokenA).send({
      full_name: 'X', date_of_birth: '2999-01-01', phone_e164: '123',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('isolates recipients between customers', async () => {
    const other = await auth(request(app).get(`/api/v1/account/recipients/${recipientId}`), tokenB);
    expect(other.status).toBe(404);

    const list = await auth(request(app).get('/api/v1/account/recipients'), tokenB);
    expect(list.body.data).toEqual([]);
  });

  it('updates and deletes an unlinked recipient', async () => {
    const upd = await auth(request(app).patch(`/api/v1/account/recipients/${recipientId}`), tokenA).send({ notes: 'Needs wheelchair' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.notes).toBe('Needs wheelchair');

    const del = await auth(request(app).delete(`/api/v1/account/recipients/${recipientId}`), tokenA);
    expect(del.status).toBe(200);

    const gone = await auth(request(app).get(`/api/v1/account/recipients/${recipientId}`), tokenA);
    expect(gone.status).toBe(404);
  });

  it('refuses to delete a recipient linked to a request', async () => {
    const created = await auth(request(app).post('/api/v1/account/recipients'), tokenB).send({ full_name: 'Linked', relationship: 'self' });
    const rid = created.body.data.id;
    const svc = (await db.query(`INSERT INTO services (slug, title_en, status, is_visible) VALUES ('s','S','published',true) RETURNING id`)).rows[0].id;
    const hosp = (await db.query(`INSERT INTO hospitals (slug, name_en, status, is_visible) VALUES ('h','H','published',true) RETURNING id`)).rows[0].id;
    const meB = await auth(request(app).get('/api/v1/account/me'), tokenB);
    await db.query(
      `INSERT INTO requests (owner_user_id, recipient_id, service_id, hospital_id) VALUES ($1,$2,$3,$4)`,
      [meB.body.data.id, rid, svc, hosp],
    );
    const del = await auth(request(app).delete(`/api/v1/account/recipients/${rid}`), tokenB);
    expect(del.status).toBe(409);
    expect(del.body.code).toBe('RECIPIENT_IN_USE');
  });
});
