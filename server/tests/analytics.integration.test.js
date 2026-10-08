import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { runDailyAggregation } from '../src/jobs/aggregate.js';
import { __getLatestOtpForTesting } from '../src/modules/auth/otp.js';

let db;
let close;
let app;
let opsToken;

const SESSION = 'test-session-001';

async function capture(event, extra = {}) {
  return request(app).post('/api/v1/analytics/events').send({
    event_name: event, anonymous_session_id: SESSION, page: '/', locale: 'en', ...extra,
  });
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });

  const hash = await hashPassword('ops-password-1');
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ('an-ops@example.com',$1,'An Ops','active') RETURNING id`, [hash]);
  await db.query(`INSERT INTO user_roles (user_id, role) VALUES ($1,'analytics_viewer')`, [rows[0].id]);
  const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'an-ops@example.com', password: 'ops-password-1' });
  opsToken = login.body.data.accessToken;
}, 120_000);

afterAll(async () => {
  await close?.();
});

const ops = (req) => req.set('Authorization', `Bearer ${opsToken}`);

describe('capture endpoint', () => {
  it('accepts allowlisted events and scrubs sensitive metadata', async () => {
    const res = await capture('PAGE_VIEWED', { metadata: { service_slug: 'pickup', password: 'secret', otp: '123456', email: 'a@b.com' } });
    expect(res.status).toBe(202);

    const { rows } = await db.query('SELECT metadata FROM analytics_events WHERE event_name = $1 LIMIT 1', ['PAGE_VIEWED']);
    expect(rows[0].metadata.service_slug).toBe('pickup');
    expect(rows[0].metadata).not.toHaveProperty('password');
    expect(rows[0].metadata).not.toHaveProperty('otp');
    expect(rows[0].metadata).not.toHaveProperty('email');
  });

  it('rejects unknown events', async () => {
    const res = await capture('HACK_THE_PLANET');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNKNOWN_EVENT');
  });
});

describe('server milestones + aggregation + dashboards', () => {
  it('records OTP/registration milestones through the real signup flow', async () => {
    await request(app).post('/api/v1/auth/signup').send({ full_name: 'Analytics User', email: 'analytics-u@example.com' });
    const otp = __getLatestOtpForTesting('analytics-u@example.com');
    await request(app).post('/api/v1/auth/otp/verify').send({
      purpose: 'signup', email: 'analytics-u@example.com', code: otp,
    });
    const kinds = (await db.query(`SELECT DISTINCT event_name FROM analytics_events`)).rows.map((r) => r.event_name);
    expect(kinds).toContain('OTP_REQUESTED');
    expect(kinds).toContain('OTP_VERIFIED');
  });

  it('aggregates complete days without touching today', async () => {
    await db.query(`INSERT INTO analytics_events (event_name, anonymous_session_id, occurred_at)
      VALUES ('PAGE_VIEWED','old-session', now() - INTERVAL '2 days'),
             ('PAGE_VIEWED','old-session', now() - INTERVAL '2 days'),
             ('OTP_VERIFIED', NULL, now() - INTERVAL '2 days')`);
    const result = await runDailyAggregation(db);
    expect(result.aggregated).toBeGreaterThanOrEqual(2);

    const rows = (await db.query('SELECT event_name, count, user_count FROM analytics_daily_counts ORDER BY event_name')).rows;
    const pv = rows.find((r) => r.event_name === 'PAGE_VIEWED');
    expect(Number(pv.count)).toBe(2);
    expect(Number(pv.user_count)).toBe(0);
  });

  it('overview merges aggregates with the live tail', async () => {
    await capture('PAGE_VIEWED');
    await capture('SIGNUP_STARTED');
    const res = await ops(request(app).get('/api/v1/ops/analytics/overview?days=7'));
    expect(res.status).toBe(200);
    expect(res.body.data.counts.PAGE_VIEWED).toBeGreaterThanOrEqual(3); // 2 aggregated + 1 live
    expect(res.body.data.visitors.anonymousSessions).toBeGreaterThanOrEqual(1);
  });

  it('funnel shows conversion and drop-off in order', async () => {
    const res = await ops(request(app).get('/api/v1/ops/analytics/funnel/onboarding?days=7'));
    expect(res.status).toBe(200);
    const events = res.body.data.steps.map((s) => s.event);
    expect(events).toEqual(['SIGNUP_STARTED', 'OTP_REQUESTED', 'OTP_VERIFIED', 'REGISTRATION_COMPLETED']);
    for (const s of res.body.data.steps.slice(1)) {
      expect(s.conversionFromPrevious).not.toBeNull();
    }
  });

  it('drop-off exposes internal IDs and steps, never PII', async () => {
    const res = await ops(request(app).get('/api/v1/ops/analytics/dropoff'));
    expect(res.status).toBe(200);
    expect(res.body.data.byStep.length).toBeGreaterThanOrEqual(1);
    const stuck = res.body.data.stuck[0];
    expect(stuck).toHaveProperty('id');
    expect(stuck).toHaveProperty('last_step');
    expect(stuck).not.toHaveProperty('email');
    expect(stuck).not.toHaveProperty('full_name');
    expect(JSON.stringify(res.body)).not.toContain('analytics-u@example.com');
  });

  it('service views rank by slug metadata', async () => {
    await capture('SERVICE_VIEWED', { metadata: { service_slug: 'pickup-support' } });
    await capture('SERVICE_VIEWED', { metadata: { service_slug: 'pickup-support' } });
    const res = await ops(request(app).get('/api/v1/ops/analytics/services?days=7'));
    expect(res.body.data.views[0]).toMatchObject({ slug: 'pickup-support', count: 2 });
  });

  it('requires an operations role', async () => {
    const res = await request(app).get('/api/v1/ops/analytics/overview');
    expect(res.status).toBe(401);
  });
});
