import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';

let db;
let close;
let app;
let opsToken;
let customerToken;

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
  await seedUser('ops@example.com', 'ops-password-1', ['operations_head', 'content_manager']);
  await seedUser('cust@example.com', 'cust-password-1', ['customer']);

  const ops = await request(app).post('/api/v1/ops/auth/login').send({ email: 'ops@example.com', password: 'ops-password-1' });
  expect(ops.status).toBe(200);
  opsToken = ops.body.data.accessToken;

  const cust = await request(app).post('/api/v1/ops/auth/login').send({ email: 'cust@example.com', password: 'cust-password-1' });
  expect(cust.status).toBe(403); // customers cannot use the ops login surface
  customerToken = null;
}, 120_000);

afterAll(async () => {
  await close?.();
});

const auth = (req, token = opsToken) => req.set('Authorization', `Bearer ${token}`);

describe('ops auth', () => {
  it('rejects wrong passwords without enumerating users', async () => {
    const res = await request(app).post('/api/v1/ops/auth/login').send({ email: 'ops@example.com', password: 'wrong-pass-99' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects malformed login bodies with fieldErrors', async () => {
    const res = await request(app).post('/api/v1/ops/auth/login').send({ email: 'nope', password: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.fieldErrors).toBeTruthy();
  });

  it('rotates refresh tokens (old one dies)', async () => {
    const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'ops@example.com', password: 'ops-password-1' });
    const r1 = await request(app).post('/api/v1/ops/auth/refresh').send({ refreshToken: login.body.data.refreshToken });
    expect(r1.status).toBe(200);
    const r2 = await request(app).post('/api/v1/ops/auth/refresh').send({ refreshToken: login.body.data.refreshToken });
    expect(r2.status).toBe(401);
  });
});

describe('services CMS vertical slice', () => {
  let serviceId;

  it('401s unauthenticated ops writes', async () => {
    const res = await request(app).post('/api/v1/ops/services').send({ title_en: 'X' });
    expect(res.status).toBe(401);
  });

  it('creates a draft (auto-slug) invisible on the public site', async () => {
    const res = await auth(request(app).post('/api/v1/ops/services')).send({ title_en: 'Post-Surgery Support', description_en: 'Help after discharge' });
    expect(res.status).toBe(201);
    expect(res.body.data.slug).toBe('post-surgery-support');
    serviceId = res.body.data.id;

    const pub = await request(app).get('/api/v1/services');
    expect(pub.body.data.find((s) => s.id === serviceId)).toBeUndefined();
  });

  it('rejects duplicate slugs with 409', async () => {
    const res = await auth(request(app).post('/api/v1/ops/services')).send({ title_en: 'Post-Surgery Support' });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLUG_TAKEN');
  });

  it('publishes → visible publicly by slug', async () => {
    const upd = await auth(request(app).patch(`/api/v1/ops/services/${serviceId}`)).send({ status: 'published' });
    expect(upd.status).toBe(200);

    const list = await request(app).get('/api/v1/services');
    expect(list.body.data.map((s) => s.slug)).toContain('post-surgery-support');

    const one = await request(app).get('/api/v1/services/post-surgery-support');
    expect(one.body.data.title_en).toBe('Post-Surgery Support');
  });

  it('wrote audit events for create + publish', async () => {
    const { rows } = await db.query(`SELECT action FROM audit_logs WHERE entity_type='service' AND entity_id=$1 ORDER BY id`, [serviceId]);
    expect(rows.map((r) => r.action)).toEqual(['SERVICE_CREATED', 'SERVICE_PUBLISHED']);
  });
});

describe('hospitals CMS vertical slice', () => {
  it('creates + publishes a hospital and filters by city', async () => {
    const created = await auth(request(app).post('/api/v1/ops/hospitals')).send({
      name_en: 'Sunrise Hospitals', city: 'Vijayawada', state: 'Andhra Pradesh', status: 'published',
    });
    expect(created.status).toBe(201);

    const filtered = await request(app).get('/api/v1/hospitals?city=Vijayawada');
    expect(filtered.body.data.map((h) => h.slug)).toContain('sunrise-hospitals');

    const other = await request(app).get('/api/v1/hospitals?city=Hyderabad');
    expect(other.body.data.map((h) => h.slug)).not.toContain('sunrise-hospitals');
  });
});

describe('content CMS vertical slice', () => {
  it('publishes FAQ + hero and serves the home bundle', async () => {
    const faq = await auth(request(app).post('/api/v1/ops/cms/faqs')).send({
      question_en: 'What does AayuYukthi do?', answer_en: 'Care coordination.', is_published: true,
    });
    expect(faq.status).toBe(201);

    const hero = await auth(request(app).post('/api/v1/ops/cms/hero-slides')).send({
      title_en: 'We coordinate your hospital journey', description_en: 'Support at every step',
    });
    expect(hero.status).toBe(201);

    const home = await request(app).get('/api/v1/content/home');
    expect(home.body.data.faqs.length).toBeGreaterThanOrEqual(1);
    expect(home.body.data.hero.length).toBeGreaterThanOrEqual(1);
  });

  it('updates contact settings and serves them publicly', async () => {
    const upd = await auth(request(app).put('/api/v1/ops/cms/contact-settings')).send({
      phone: '+919876543210', email: 'care@example.com', address_en: 'Vijayawada', hours_en: '9am-9pm', socials: {},
    });
    expect(upd.status).toBe(200);
    const pub = await request(app).get('/api/v1/content/contact');
    expect(pub.body.data.phone).toBe('+919876543210');
  });

  it('upserts content blocks (about page)', async () => {
    const put = await auth(request(app).put('/api/v1/ops/cms/content-blocks')).send({
      key: 'about.mission', title_en: 'Our mission', body_en: 'Care for all.', status: 'published',
    });
    expect(put.status).toBe(200);
    const pub = await request(app).get('/api/v1/content/blocks/about.mission');
    expect(pub.body.data.title_en).toBe('Our mission');
  });
});

describe('customer isolation', () => {
  it('forbids customer tokens on ops routes', async () => {
    const { signAccessToken } = await import('../src/modules/auth/tokens.js');
    customerToken = signAccessToken({ id: 'cust-id', roles: ['customer'] });
    const res = await auth(request(app).get('/api/v1/ops/services'), customerToken);
    expect(res.status).toBe(403);
  });
});

describe('batch content blocks (homepage sections)', () => {
  it('returns published blocks as a keyed map, omitting missing keys', async () => {
    const res = await request(app).get('/api/v1/content/blocks?keys=about.mission,home.hero.title,does.not.exist');
    expect(res.status).toBe(200);
    expect(res.body.data['about.mission'].title_en).toBe('Our mission');
    expect(res.body.data['home.hero.title']).toBeUndefined();
    expect(res.body.data['does.not.exist']).toBeUndefined();
  });

  it('returns an empty map for no keys', async () => {
    const res = await request(app).get('/api/v1/content/blocks');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({});
  });
});
