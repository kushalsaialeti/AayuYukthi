import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { toPublicUser } from '../src/utils/dto.js';
import { scrubMetadata } from '../src/modules/analytics/events.js';
import { passwordSchema } from '../src/validation/common.js';

let db;
let close;
let app;
let headToken;
let staffToken;

async function seedOpsUser(email, password, roles) {
  const hash = await hashPassword(password);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ($1,$2,$3,'active') RETURNING id`,
    [email, hash, email],
  );
  for (const role of roles) {
    await db.query('INSERT INTO user_roles (user_id, role) VALUES ($1,$2)', [rows[0].id, role]);
  }
  const login = await request(app).post('/api/v1/ops/auth/login').send({ email, password });
  return login.body.data.accessToken;
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  headToken = await seedOpsUser('audit-head@example.com', 'head-password-1', ['operations_head']);
  staffToken = await seedOpsUser('audit-staff@example.com', 'staff-password-1', ['operations_staff']);
}, 120_000);

afterAll(async () => {
  await close?.();
});

describe('audit log viewer', () => {
  it('records ops actions and serves them to heads, not staff', async () => {
    const created = await request(app).post('/api/v1/ops/services')
      .set('Authorization', `Bearer ${headToken}`)
      .send({ title_en: 'Audited Service' });
    expect(created.status).toBe(201);

    const asHead = await request(app).get('/api/v1/ops/audit-logs').set('Authorization', `Bearer ${headToken}`);
    expect(asHead.status).toBe(200);
    expect(asHead.body.data.some((a) => a.action === 'SERVICE_CREATED')).toBe(true);

    const filtered = await request(app).get('/api/v1/ops/audit-logs').query({ action: 'SERVICE_CREATED' }).set('Authorization', `Bearer ${headToken}`);
    expect(filtered.body.data.length).toBeGreaterThanOrEqual(1);

    const asStaff = await request(app).get('/api/v1/ops/audit-logs').set('Authorization', `Bearer ${staffToken}`);
    expect(asStaff.status).toBe(403);
  });
});

describe('session security', () => {
  it('detects refresh-token reuse and kills all sessions', async () => {
    const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'audit-staff@example.com', password: 'staff-password-1' });
    const firstRefresh = login.body.data.refreshToken;

    const rotated = await request(app).post('/api/v1/ops/auth/refresh').send({ refreshToken: firstRefresh });
    expect(rotated.status).toBe(200);

    // Attacker replays the old (rotated-out) token.
    const replay = await request(app).post('/api/v1/ops/auth/refresh').send({ refreshToken: firstRefresh });
    expect(replay.status).toBe(401);

    // The legitimate rotated token is now dead too — user must log in again.
    const legit = await request(app).post('/api/v1/ops/auth/refresh').send({ refreshToken: rotated.body.data.refreshToken });
    expect(legit.status).toBe(401);

    const audit = await db.query(`SELECT action FROM audit_logs WHERE action = 'SESSION_REUSE_DETECTED'`);
    expect(audit.rows.length).toBeGreaterThanOrEqual(1);
  });

  it('logout-all revokes every session', async () => {
    const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'audit-head@example.com', password: 'head-password-1' });
    const res = await request(app).post('/api/v1/ops/auth/logout-all')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.revoked).toBeGreaterThanOrEqual(1);

    const refresh = await request(app).post('/api/v1/ops/auth/refresh').send({ refreshToken: login.body.data.refreshToken });
    expect(refresh.status).toBe(401);
  });
});

describe('input + secret hygiene', () => {
  it('rejects common passwords at the schema layer', () => {
    expect(passwordSchema.safeParse('password123').success).toBe(false);
    expect(passwordSchema.safeParse('x9#Kv2$mQpLz!w8nR').success).toBe(true);
  });

  it('DTOs never carry hashes or tokens', () => {
    const dto = toPublicUser({ id: 'u', password_hash: 'h', token: 't', email: 'e' });
    expect(JSON.stringify(dto)).not.toMatch(/password_hash|token/);
  });

  it('analytics scrub strips credentials, codes, and PII keys', () => {
    const out = scrubMetadata({ service_slug: 'x', password: 'p', otp: '1', email: 'e', token: 't', step: 3 });
    expect(out).toEqual({ service_slug: 'x', step: 3 });
  });

  it('serves security headers and hides the stack', () => {
    return request(app).get('/api/v1/').then((res) => {
      expect(res.headers['x-powered-by']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  it('maps malformed UUIDs to 400, not 500', async () => {
    const res = await request(app).get('/api/v1/ops/services/not-a-uuid').set('Authorization', `Bearer ${headToken}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INPUT');
  });
});
