import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';

let db;
let close;
let app;
let headToken;
let staffToken;

async function seedUser(email, password, roles) {
  const hash = await hashPassword(password);
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ($1,$2,$3,'active') RETURNING id`,
    [email, hash, email],
  );
  for (const role of roles) {
    await db.query(`INSERT INTO user_roles (user_id, role) VALUES ($1,$2)`, [rows[0].id, role]);
  }
  return rows[0].id;
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  await seedUser('sec-head@example.com', 'head-password-1', ['operations_head']);
  await seedUser('sec-staff@example.com', 'staff-password-1', ['content_manager']);

  const head = await request(app).post('/api/v1/ops/auth/login').send({ email: 'sec-head@example.com', password: 'head-password-1' });
  headToken = head.body.data.accessToken;
  const staff = await request(app).post('/api/v1/ops/auth/login').send({ email: 'sec-staff@example.com', password: 'staff-password-1' });
  staffToken = staff.body.data.accessToken;
}, 120_000);

afterAll(async () => {
  await close?.();
});

const auth = (req, token = headToken) => req.set('Authorization', `Bearer ${token}`);

describe('portal-wide unique user IDs', () => {
  it('generates a public_id for every new user at the database level', async () => {
    const { rows } = await db.query(
      `INSERT INTO users (email, full_name, status) VALUES ('pid@example.com', 'PID User', 'active') RETURNING public_id`,
    );
    expect(rows[0].public_id).toMatch(/^AY-[0-9A-Z]{8}$/);
  });

  it('public_ids are unique across accounts', async () => {
    const { rows } = await db.query(
      `INSERT INTO users (email, full_name, status) VALUES
         ('pid2@example.com', 'U2', 'active'), ('pid3@example.com', 'U3', 'active')
       RETURNING public_id`,
    );
    expect(rows[0].public_id).not.toBe(rows[1].public_id);
  });
});

describe('attack-signature monitor', () => {
  it('blocks SQL injection probes in query strings with a taunt, and records the event', async () => {
    const res = await request(app).get("/api/v1/content/faqs?q=%27%20OR%201%3D1%20--");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SECURITY_BLOCKED');
    // every rotating taunt is joker-branded (never a helpful error)
    expect(res.body.message).toMatch(/🃏/);
    expect(res.body.requestId).toBeTruthy();

    const { rows } = await db.query(
      `SELECT event_type, severity, path FROM security_events WHERE event_type = 'SQL_INJECTION' ORDER BY created_at DESC LIMIT 1`,
    );
    expect(rows.length).toBe(1);
    expect(rows[0].severity).toBe('high');
    expect(rows[0].path).toContain('/content/faqs');
  });

  it('blocks XSS payloads in request bodies before they reach handlers', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: '<script>alert(1)</script>', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SECURITY_BLOCKED');
  });

  it('blocks path traversal attempts', async () => {
    const res = await request(app).get('/api/v1/content/blocks?keys=../../etc/passwd');
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('SECURITY_BLOCKED');
  });

  it('lets legitimate traffic through untouched', async () => {
    const res = await request(app).get('/api/v1/content/faqs?limit=5');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('answers rate-limit floods with the taunt shape too', async () => {
    // handler contract check (limiter itself is skipped in test env)
    const { rateLimitHandler } = await import('../src/security/middleware.js');
    let payload = null;
    const handler = rateLimitHandler('RATE_LIMITED_AUTH');
    handler({ ip: '1.2.3.4', method: 'POST', originalUrl: '/x', requestId: 'r1', rateLimit: {} },
      { status: (c) => ({ json: (b) => { payload = { status: c, body: b }; } }) });
    expect(payload.status).toBe(429);
    expect(payload.body.code).toBe('RATE_LIMITED');
    expect(payload.body.message).toMatch(/notified/i);
  });
});

describe('operations → security (admin alarm surface)', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/ops/security/events');
    expect(res.status).toBe(401);
  });

  it('forbids non-head staff (content_manager)', async () => {
    const res = await auth(request(app).get('/api/v1/ops/security/events'), staffToken);
    expect(res.status).toBe(403);
  });

  it('lets operations_head page through recorded events', async () => {
    const res = await auth(request(app).get('/api/v1/ops/security/events?severity=high'));
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.pagination).toBeTruthy();
    expect(res.body.data[0].event_type).toBeTruthy();
  });

  it('returns the 24h severity summary', async () => {
    const res = await auth(request(app).get('/api/v1/ops/security/summary'));
    expect(res.status).toBe(200);
    expect(res.body.data.bySeverity.high).toBeGreaterThanOrEqual(1);
  });
});
