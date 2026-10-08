import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireAuth, requireRole, requireOperations } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { signAccessToken } from '../src/modules/auth/tokens.js';

function fixtureApp(...guards) {
  const app = express();
  app.get('/guarded', ...guards, (_req, res) => res.json({ data: { ok: true } }));
  app.use(errorHandler);
  return app;
}

describe('requireAuth + requireRole', () => {
  it('401 without a bearer token', async () => {
    const res = await request(fixtureApp(requireAuth)).get('/guarded');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('401 on a tampered token', async () => {
    const res = await request(fixtureApp(requireAuth)).get('/guarded').set('Authorization', 'Bearer nope');
    expect(res.status).toBe(401);
  });

  it('allows a valid customer token through requireAuth', async () => {
    const token = signAccessToken({ id: 'u1', roles: ['customer'] });
    const res = await request(fixtureApp(requireAuth)).get('/guarded').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('403 when role is missing, 200 when present', async () => {
    const customer = signAccessToken({ id: 'u1', roles: ['customer'] });
    const staff = signAccessToken({ id: 'u2', roles: ['operations_staff'] });
    const app = fixtureApp(requireAuth, requireOperations());

    const denied = await request(app).get('/guarded').set('Authorization', `Bearer ${customer}`);
    expect(denied.status).toBe(403);
    expect(denied.body.code).toBe('FORBIDDEN');

    const allowed = await request(app).get('/guarded').set('Authorization', `Bearer ${staff}`);
    expect(allowed.status).toBe(200);
  });

  it('requireRole without requireAuth first still 401s (safe ordering)', async () => {
    const res = await request(fixtureApp(requireRole('customer'))).get('/guarded');
    expect(res.status).toBe(401);
  });
});
