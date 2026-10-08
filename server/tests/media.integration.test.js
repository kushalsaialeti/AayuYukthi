import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { hashPassword } from '../src/modules/auth/password.js';
import { buildTransformation, deliveryUrlFor } from '../src/modules/media/cloudinaryProvider.js';

let db;
let close;
let app;
let opsToken;

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  const hash = await hashPassword('media-ops-1');
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, full_name, status) VALUES ('media-ops@example.com',$1,'Media Ops','active') RETURNING id`, [hash]);
  await db.query(`INSERT INTO user_roles (user_id, role) VALUES ($1,'content_manager')`, [rows[0].id]);
  const login = await request(app).post('/api/v1/ops/auth/login').send({ email: 'media-ops@example.com', password: 'media-ops-1' });
  opsToken = login.body.data.accessToken;
}, 120_000);

afterAll(async () => {
  await close?.();
});

beforeEach(() => {
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
});

const ops = (req) => req.set('Authorization', `Bearer ${opsToken}`);

describe('media library', () => {
  it('fails closed on signatures without credentials', async () => {
    const res = await ops(request(app).post('/api/v1/ops/media/signature')).send({ folder: 'aayuyukthi' });
    expect(res.status).toBe(503);
    expect(res.body.code).toBe('MEDIA_NOT_CONFIGURED');
  });

  it('registers external references with validation', async () => {
    const bad = await ops(request(app).post('/api/v1/ops/media')).send({
      url: 'https://cdn.example/x.jpg', mime_type: 'application/x-exe',
    });
    expect(bad.status).toBe(400);

    const res = await ops(request(app).post('/api/v1/ops/media')).send({
      url: 'https://cdn.example/hero.jpg', mime_type: 'image/jpeg', size_bytes: 1024,
      original_filename: 'hero.jpg', alt_text: 'Hero image',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.provider).toBe('external');
    expect(res.body.data.delivery_url).toBe('https://cdn.example/hero.jpg');
  });

  it('reuses instead of duplicating the same cloudinary asset', async () => {
    const payload = { provider: 'cloudinary', provider_asset_id: 'aayuyukthi/hero1', mime_type: 'image/jpeg' };
    const first = await ops(request(app).post('/api/v1/ops/media')).send(payload);
    expect(first.status).toBe(201);
    const second = await ops(request(app).post('/api/v1/ops/media')).send(payload);
    expect(second.status).toBe(201);
    expect(second.body.data.id).toBe(first.body.data.id);
  });

  it('serves responsive variants publicly without leaking provider internals', async () => {
    const created = await ops(request(app).post('/api/v1/ops/media')).send({
      url: 'https://cdn.example/card.jpg', mime_type: 'image/webp', alt_text: 'Card',
    });
    const res = await request(app).get(`/api/v1/media/${created.body.data.id}?widths=400,800`);
    expect(res.status).toBe(200);
    expect(res.body.data.src).toBe('https://cdn.example/card.jpg');
    expect(res.body.data.alt_text).toBe('Card');
  });

  it('refuses to delete referenced assets, archives instead', async () => {
    const created = await ops(request(app).post('/api/v1/ops/media')).send({
      url: 'https://cdn.example/used.jpg', mime_type: 'image/jpeg',
    });
    const mid = created.body.data.id;
    const svc = await ops(request(app).post('/api/v1/ops/services')).send({ title_en: 'Media Svc', image_media_id: mid });
    expect(svc.status).toBe(201);

    const del = await ops(request(app).delete(`/api/v1/ops/media/${mid}`));
    expect(del.status).toBe(409);
    expect(del.body.code).toBe('MEDIA_IN_USE');

    const arch = await ops(request(app).post(`/api/v1/ops/media/${mid}/archive`));
    expect(arch.status).toBe(200);
    expect(arch.body.data.status).toBe('archived');
  });

  it('migration 014 columns exist', async () => {
    const { rows } = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'media'`);
    const cols = rows.map((r) => r.column_name);
    for (const c of ['provider', 'provider_asset_id', 'resource_type', 'original_filename', 'width', 'height', 'format', 'status']) {
      expect(cols).toContain(c);
    }
  });
});

describe('cloudinary provider contract (no network)', () => {
  it('builds f_auto/q_auto responsive transformations from the master', () => {
    const t = buildTransformation({ width: 800 });
    expect(t.fetch_format).toBe('auto');
    expect(t.quality).toBe('auto');
    expect(t.width).toBe(800);
    expect(t.crop).toBe('limit'); // never upscale/crop blindly without height
  });

  it('renders deterministic delivery URLs when configured', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    const url = deliveryUrlFor('aayuyukthi/hero1', { width: 800 });
    expect(url).toContain('res.cloudinary.com/demo-cloud');
    expect(url).toContain('aayuyukthi/hero1');
    expect(url).toContain('f_auto');
    expect(url).not.toContain('secret');
  });
});

describe('frontend secret sweep (acceptance criteria as tests)', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const roots = [
    path.resolve(here, '../../apps/web/src'),
    path.resolve(here, '../../apps/operations/src'),
  ];

  function files(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      return e.isDirectory() ? files(p) : [p];
    });
  }

  it('no hardcoded cloudinary URLs, supabase keys, or secrets in frontend source', () => {
    const banned = [/res\.cloudinary\.com/, /supabase\.co/, /service_role/i, /CLOUDINARY_API_SECRET/, /SUPABASE_SERVICE/];
    const hits = [];
    for (const root of roots) {
      for (const f of files(root)) {
        const src = fs.readFileSync(f, 'utf8');
        for (const re of banned) {
          if (re.test(src)) hits.push(`${path.relative(here, f)}: ${re}`);
        }
      }
    }
    expect(hits).toEqual([]);
  });
});
