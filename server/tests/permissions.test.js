import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';

// Role × surface matrix. The contract under test:
// - customers: own account/requests/support only; zero ops access
// - staff/head/content: full ops read+write (V1 simplification, see SECURITY.md)
// - analytics_viewer: ops reads only — every mutation 403s
// - anonymous: public reads only

let db;
let close;
let app;
const tokens = {};

async function seedUser(email, password, roles) {
  const hash = await hashPassword(password);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ($1,$2,$3,'active') RETURNING id`,
    [email, hash, email],
  );
  for (const role of roles) {
    await db.query('INSERT INTO user_roles (user_id, role) VALUES ($1,$2)', [rows[0].id, role]);
  }
  const login = await request(app).post('/api/v1/ops/auth/login').send({ email, password });
  if (roles.includes('customer')) {
    const c = await request(app).post('/api/v1/auth/login').send({ identifier: email, password });
    return c.body.data.accessToken;
  }
  return login.body.data.accessToken;
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  tokens.head = await seedUser('m-head@example.com', 'head-password-1', ['operations_head']);
  tokens.staff = await seedUser('m-staff@example.com', 'staff-password-1', ['operations_staff']);
  tokens.content = await seedUser('m-content@example.com', 'content-password-1', ['content_manager']);
  tokens.viewer = await seedUser('m-viewer@example.com', 'viewer-password-1', ['analytics_viewer']);
  tokens.customer = await seedUser('m-cust@example.com', 'cust-password-1', ['customer']);
}, 180_000);

afterAll(async () => {
  await close?.();
});

const as = (role) => (req) => req.set('Authorization', `Bearer ${tokens[role]}`);

describe('permissions matrix', () => {
  it('anonymous: public reads 200, everything else 401', async () => {
    expect((await request(app).get('/api/v1/services')).status).toBe(200);
    expect((await request(app).get('/api/v1/ops/services')).status).toBe(401);
    expect((await request(app).get('/api/v1/account/me')).status).toBe(401);
    expect((await request(app).get('/api/v1/ops/analytics/overview')).status).toBe(401);
  });

  it('customer: zero ops access (403 or 401, never success)', async () => {
    for (const [method, path, body] of [
      ['get', '/api/v1/ops/services'],
      ['post', '/api/v1/ops/services', { title_en: 'X' }],
      ['get', '/api/v1/ops/requests'],
      ['get', '/api/v1/ops/customers'],
      ['get', '/api/v1/ops/analytics/overview'],
      ['get', '/api/v1/ops/audit-logs'],
    ]) {
      const res = await as('customer')(request(app)[method](path)).send(body ?? {});
      expect([401, 403]).toContain(res.status);
    }
  });

  it('staff/head/content: ops read+write allowed', async () => {
    for (const role of ['staff', 'head', 'content']) {
      const list = await as(role)(request(app).get('/api/v1/ops/services'));
      expect(list.status, role).toBe(200);
      const create = await as(role)(request(app).post('/api/v1/ops/services')).send({ title_en: `Svc ${role}` });
      expect(create.status, role).toBe(201);
    }
  });

  it('analytics_viewer: reads allowed, every mutation forbidden', async () => {
    expect((await as('viewer')(request(app).get('/api/v1/ops/services'))).status).toBe(200);
    expect((await as('viewer')(request(app).get('/api/v1/ops/analytics/overview'))).status).toBe(200);
    expect((await as('viewer')(request(app).get('/api/v1/ops/audit-logs'))).status).toBe(200);

    const mutations = [
      ['post', '/api/v1/ops/services', { title_en: 'Nope' }],
      ['post', '/api/v1/ops/hospitals', { name_en: 'Nope' }],
      ['post', '/api/v1/ops/cms/faqs', { question_en: 'Q', answer_en: 'A' }],
      ['put', '/api/v1/ops/cms/contact-settings', { address_en: 'X', hours_en: 'Y' }],
    ];
    for (const [method, path, body] of mutations) {
      const res = await as('viewer')(request(app)[method](path)).send(body);
      expect(res.status, `${method} ${path}`).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    }
  });

  it('viewer login still works (only mutations are fenced)', async () => {
    // Viewer token obtained in setup proves /ops/auth/login stays public-behind-role.
    expect(tokens.viewer).toBeTruthy();
  });
});

describe('rate-limit smoke (last: mutates in-memory limiter state)', () => {
  it('auth limiter eventually 429s runaway login attempts', async () => {
    let saw429 = false;
    for (let i = 0; i < 35; i++) {
      const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'nobody@example.com', password: 'wrong-pass' });
      if (res.status === 429) {
        saw429 = true;
        expect(res.body.code).toBe('RATE_LIMITED');
        break;
      }
    }
    expect(saw429).toBe(true);
  });
});
