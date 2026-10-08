import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { __getLatestOtpForTesting } from '../src/modules/auth/otp.js';

let db;
let close;
let app;

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
}, 120_000);

afterAll(async () => {
  await close?.();
});

describe('customer auth vertical slice', () => {
  let signupOtp;
  let userId;

  it('signs up with email+password and generates OTP without devOtp in response', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      full_name: 'Test User', email: 'testuser@example.com', password: 'test-password-1',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.user.id).toBeTruthy();
    expect(res.body.data.user).not.toHaveProperty('password_hash');
    expect(res.body.data.otp).not.toHaveProperty('devOtp');
    signupOtp = __getLatestOtpForTesting('testuser@example.com');
    expect(signupOtp).toMatch(/^\d{6}$/);
    userId = res.body.data.user.id;
  });

  it('rejects duplicate signup without revealing more', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      full_name: 'Test User', email: 'testuser@example.com', password: 'test-password-1',
    });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('ACCOUNT_EXISTS');
  });

  it('verifies the OTP and issues tokens', async () => {
    const res = await request(app).post('/api/v1/auth/otp/verify').send({
      purpose: 'signup', email: 'testuser@example.com', code: signupOtp,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();

    const { rows } = await db.query('SELECT onboarding_last_step, email_verified_at FROM users WHERE id = $1', [userId]);
    expect(rows[0].onboarding_last_step).toBe('OTP_VERIFIED');
    expect(rows[0].email_verified_at).not.toBeNull();
  });

  it('rejects consumed/reused codes', async () => {
    const res = await request(app).post('/api/v1/auth/otp/verify').send({
      purpose: 'signup', email: 'testuser@example.com', code: signupOtp,
    });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_OTP');
  });

  it('logs in with password and rotates refresh', async () => {
    const login = await request(app).post('/api/v1/auth/login').send({
      identifier: 'testuser@example.com', password: 'test-password-1',
    });
    expect(login.status).toBe(200);
    expect(login.body.data.user.roles).toContain('customer');

    const bad = await request(app).post('/api/v1/auth/login').send({
      identifier: 'testuser@example.com', password: 'wrong-password',
    });
    expect(bad.status).toBe(401);

    const r1 = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: login.body.data.refreshToken });
    expect(r1.status).toBe(200);
  });

  it('recovers the password via OTP and revokes old sessions', async () => {
    const before = await request(app).post('/api/v1/auth/login').send({
      identifier: 'testuser@example.com', password: 'test-password-1',
    });
    const oldRefresh = before.body.data.refreshToken;

    const req = await request(app).post('/api/v1/auth/otp/request').send({
      purpose: 'recovery', email: 'testuser@example.com',
    });
    expect(req.status).toBe(200);
    expect(req.body.data).not.toHaveProperty('devOtp');
    const recoveryOtp = __getLatestOtpForTesting('testuser@example.com');

    const confirm = await request(app).post('/api/v1/auth/recovery/confirm').send({
      email: 'testuser@example.com', code: recoveryOtp, newPassword: 'brand-new-pass-2',
    });
    expect(confirm.status).toBe(200);

    const stale = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: oldRefresh });
    expect(stale.status).toBe(401);

    const login = await request(app).post('/api/v1/auth/login').send({
      identifier: 'testuser@example.com', password: 'brand-new-pass-2',
    });
    expect(login.status).toBe(200);
  });

  it('supports passwordless phone login via OTP', async () => {
    const signup = await request(app).post('/api/v1/auth/signup').send({
      full_name: 'Phone User', phone_e164: '+919876543210',
    });
    expect(signup.status).toBe(201);
    const phoneOtp = __getLatestOtpForTesting('+919876543210');

    const verify = await request(app).post('/api/v1/auth/otp/verify').send({
      purpose: 'signup', phone_e164: '+919876543210', code: phoneOtp,
    });
    expect(verify.status).toBe(200);
    expect(verify.body.data.accessToken).toBeTruthy();
  });

  it('rejects OTP for unknown login identifiers', async () => {
    const res = await request(app).post('/api/v1/auth/otp/request').send({
      purpose: 'login', email: 'ghost@example.com',
    });
    expect(res.status).toBe(404);
  });
});
