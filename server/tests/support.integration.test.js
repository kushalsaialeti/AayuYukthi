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
let customerToken;
let customerId;
let ticketId;

async function signupLogin(email) {
  await request(app).post('/api/v1/auth/signup').send({ full_name: 'Support User', email });
  const otp = __getLatestOtpForTesting(email);
  const verify = await request(app).post('/api/v1/auth/otp/verify').send({ purpose: 'signup', email, code: otp });
  return { token: verify.body.data.accessToken, id: verify.body.data.user.id };
}

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });

  const hash = await hashPassword('ops-password-1');
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ('sup-ops@example.com',$1,'Sup Ops','active') RETURNING id`, [hash]);
  staffId = rows[0].id;
  await db.query(`INSERT INTO user_roles (user_id, role) VALUES ($1,'operations_staff')`, [staffId]);
  const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'sup-ops@example.com', password: 'ops-password-1' });
  opsToken = login.body.data.accessToken;

  const cust = await signupLogin('support-cust@example.com');
  customerToken = cust.token;
  customerId = cust.id;
}, 120_000);

afterAll(async () => {
  await close?.();
});

const cust = (req) => req.set('Authorization', `Bearer ${customerToken}`);
const ops = (req) => req.set('Authorization', `Bearer ${opsToken}`);

describe('support thread', () => {
  it('customer opens a ticket linked to nothing, ops sees it in queue', async () => {
    const res = await cust(request(app).post('/api/v1/support/tickets')).send({
      subject: 'Pickup timing', message: 'What time will pickup arrive?',
    });
    expect(res.status).toBe(201);
    ticketId = res.body.data.ticket.id;
    expect(res.body.data.messages.length).toBe(1);

    const queue = await ops(request(app).get('/api/v1/ops/support'));
    expect(queue.body.data.length).toBe(1);
    expect(queue.body.data[0].customer_email).toBe('support-cust@example.com');
  });

  it('rejects linking another customer\u2019s request', async () => {
    const res = await cust(request(app).post('/api/v1/support/tickets')).send({
      subject: 'X', message: 'Y', request_id: '00000000-0000-0000-0000-000000000000',
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_REQUEST_LINK');
  });

  it('ops internal note stays hidden; visible reply notifies the customer', async () => {
    const internal = await ops(request(app).post(`/api/v1/ops/support/${ticketId}/messages`)).send({
      message: 'Check with transport team', is_internal: true,
    });
    expect(internal.status).toBe(201);

    const asCustomer = await cust(request(app).get(`/api/v1/support/tickets/${ticketId}`));
    expect(asCustomer.body.data.messages.length).toBe(1); // still just their own

    const reply = await ops(request(app).post(`/api/v1/ops/support/${ticketId}/messages`)).send({
      message: 'Pickup is scheduled for 8am.', is_internal: false,
    });
    expect(reply.status).toBe(201);

    const thread = await cust(request(app).get(`/api/v1/support/tickets/${ticketId}`));
    expect(thread.body.data.messages.length).toBe(2);
    expect(JSON.stringify(thread.body)).not.toContain('transport team');

    const notifs = await cust(request(app).get('/api/v1/support/notifications'));
    expect(notifs.body.data.some((n) => n.type === 'support_update')).toBe(true);
    expect(notifs.body.meta.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('customer reply reopens waiting state and pings assignee', async () => {
    await ops(request(app).patch(`/api/v1/ops/support/${ticketId}/assign`)).send({ assigned_to: staffId });
    await ops(request(app).patch(`/api/v1/ops/support/${ticketId}/status`)).send({ to_status: 'waiting_on_customer' });

    const reply = await cust(request(app).post(`/api/v1/support/tickets/${ticketId}/messages`)).send({ message: 'Thanks, noted!' });
    expect(reply.status).toBe(201);
    expect(reply.body.data.ticket.status).toBe('in_progress');

    const staffNotifs = await db.query(`SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = $1 AND type = 'support_update'`, [staffId]);
    expect(staffNotifs.rows[0].c).toBe(1);
  });

  it('resolve notifies; closed tickets reject replies; transitions guarded', async () => {
    const resolved = await ops(request(app).patch(`/api/v1/ops/support/${ticketId}/status`)).send({ to_status: 'resolved' });
    expect(resolved.status).toBe(200);

    const bad = await ops(request(app).patch(`/api/v1/ops/support/${ticketId}/status`)).send({ to_status: 'open' });
    expect(bad.status).toBe(409);

    const closed = await cust(request(app).post(`/api/v1/support/tickets/${ticketId}/close`));
    expect(closed.body.data.ticket.status).toBe('closed');

    const late = await cust(request(app).post(`/api/v1/support/tickets/${ticketId}/messages`)).send({ message: 'One more thing' });
    expect(late.status).toBe(409);
    expect(late.body.code).toBe('TICKET_CLOSED');
  });
});

describe('notifications feed', () => {
  it('marks read and read-all', async () => {
    const list = await cust(request(app).get('/api/v1/support/notifications'));
    const first = list.body.data[0].id;
    const one = await cust(request(app).patch(`/api/v1/support/notifications/${first}/read`));
    expect(one.body.data.is_read).toBe(true);

    const all = await cust(request(app).post('/api/v1/support/notifications/read-all'));
    expect(all.body.data.marked).toBeGreaterThanOrEqual(0);

    const unread = await cust(request(app).get('/api/v1/support/notifications')).query({ unread: 'true' });
    expect(unread.body.data).toEqual([]);
  });

  it('request status updates with customer messages create notifications', async () => {
    const svc = (await db.query(`INSERT INTO services (slug, title_en, status, is_visible) VALUES ('ns','N Svc','published',true) RETURNING id`)).rows[0].id;
    const hosp = (await db.query(`INSERT INTO hospitals (slug, name_en, status, is_visible) VALUES ('nh','N Hosp','published',true) RETURNING id`)).rows[0].id;
    const rec = (await db.query(`INSERT INTO care_recipients (owner_user_id, full_name) VALUES ($1,'R') RETURNING id`, [customerId])).rows[0].id;
    const req = (await db.query(
      `INSERT INTO requests (owner_user_id, recipient_id, service_id, hospital_id, idempotency_key) VALUES ($1,$2,$3,$4,'notif-seed') RETURNING id`,
      [customerId, rec, svc, hosp])).rows[0].id;

    const upd = await ops(request(app).patch(`/api/v1/ops/requests/${req}/status`)).send({
      to_status: 'UNDER_REVIEW', customer_message: 'We started the review.',
    });
    expect(upd.status).toBe(200);

    const feed = await cust(request(app).get('/api/v1/support/notifications')).query({ unread: 'true' });
    expect(feed.body.data.some((n) => n.type === 'request_update')).toBe(true);
  });
});
