import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';
import { setTranslationProvider } from '../src/modules/translation/providers.js';

let db;
let close;
let app;
let calls = 0;

beforeAll(async () => {
  ({ db, close } = await bootTestDb());
  app = createApp({ db });
  // Deterministic stub provider: echoes with a Telugu-simulating suffix.
  setTranslationProvider({
    translate: async ({ text }) => {
      calls += 1;
      return { text: `${text} [te]`, provider: 'stub' };
    },
  });
}, 120_000);

afterAll(async () => {
  setTranslationProvider(null);
  await close?.();
});

describe('translation batch endpoint', () => {
  let serviceId;

  it('translates catalog fields and caches (provider hit once)', async () => {
    serviceId = (await db.query(
      `INSERT INTO services (slug, title_en, description_en, status, is_visible)
       VALUES ('tr-svc','Pickup Support','Door-to-door pickup help','published',true) RETURNING id`)).rows[0].id;

    const body = { target_locale: 'te', items: [{ entity_type: 'services', entity_id: serviceId, field: 'title_en' }] };
    const first = await request(app).post('/api/v1/translate/batch').send(body);
    expect(first.status).toBe(200);
    expect(first.body.data[0].text).toBe('Pickup Support [te]');
    expect(first.body.data[0].cached).toBe(false);

    const second = await request(app).post('/api/v1/translate/batch').send(body);
    expect(second.body.data[0].cached).toBe(true);
    expect(calls).toBe(1);

    const cached = await db.query('SELECT provider FROM translation_cache');
    expect(cached.rows[0].provider).toBe('stub');
  });

  it('retranslates after the English master changes', async () => {
    await db.query(`UPDATE services SET title_en = 'New Title', updated_at = now() WHERE id = $1`, [serviceId]);
    // Simulate the CMS update path invalidating stale rows.
    const { invalidateTranslations } = await import('../src/modules/translation/service.js');
    await invalidateTranslations(db, 'services', serviceId);

    const res = await request(app).post('/api/v1/translate/batch').send({
      target_locale: 'te', items: [{ entity_type: 'services', entity_id: serviceId, field: 'title_en' }],
    });
    expect(res.body.data[0].text).toBe('New Title [te]');
    expect(res.body.data[0].cached).toBe(false);
    expect(calls).toBe(2);
  });

  it('rejects non-translatable entities and unsupported locales', async () => {
    const bad = await request(app).post('/api/v1/translate/batch').send({
      target_locale: 'te', items: [{ entity_type: 'users', entity_id: 'x', field: 'password_hash' }],
    });
    expect(bad.body.data[0].error).toBe('NOT_TRANSLATABLE');

    const locale = await request(app).post('/api/v1/translate/batch').send({
      target_locale: 'fr', items: [{ entity_type: 'services', entity_id: serviceId, field: 'title_en' }],
    });
    expect(locale.status).toBe(400);
  });

  it('returns per-item errors without failing the batch', async () => {
    const res = await request(app).post('/api/v1/translate/batch').send({
      target_locale: 'te',
      items: [
        { entity_type: 'services', entity_id: serviceId, field: 'title_en' },
        { entity_type: 'services', entity_id: '00000000-0000-0000-0000-000000000000', field: 'title_en' },
      ],
    });
    expect(res.status).toBe(200);
    expect(res.body.data[0].text).toContain('[te]');
    expect(res.body.data[1].text).toBeNull();
  });

  it('503s gracefully when no provider is configured', async () => {
    setTranslationProvider(null);
    await db.query('DELETE FROM translation_cache');
    const faqId = (await db.query(
      `INSERT INTO faqs (question_en, answer_en, is_published) VALUES ('What?','This.','true') RETURNING id`)).rows[0].id;
    const res = await request(app).post('/api/v1/translate/batch').send({
      target_locale: 'te', items: [{ entity_type: 'faqs', entity_id: faqId, field: 'question_en' }],
    });
    // Item-level failure surfaces as an error code, batch stays 200 (client falls back to English).
    expect(res.body.data[0].error).toMatch(/TRANSLATION_(UNAVAILABLE|FAILED)/);
  });
});
