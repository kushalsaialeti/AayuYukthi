import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { bootTestDb } from './helpers/pglite.js';
import { createApp } from '../src/app.js';

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

describe('public contact form', () => {
  it('accepts a valid submission and records an audit event', async () => {
    const res = await request(app).post('/api/v1/contact').send({
      name: 'Lakshmi', email: 'lakshmi@example.com', subject: 'Pickup question', message: 'Do you offer pickup in Guntur?',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();

    const { rows } = await db.query(`SELECT action FROM audit_logs WHERE entity_id = $1`, [res.body.data.id]);
    expect(rows.map((r) => r.action)).toContain('CONTACT_RECEIVED');
  });

  it('requires a contact channel and a message', async () => {
    const res = await request(app).post('/api/v1/contact').send({ name: 'No Channel', message: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('rejects oversized payloads via validation', async () => {
    const res = await request(app).post('/api/v1/contact').send({
      name: 'Big', email: 'big@example.com', message: 'x'.repeat(6000),
    });
    expect(res.status).toBe(400);
  });
});
