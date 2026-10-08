import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Phase 0 foundation', () => {
  it('GET /api/v1/ returns API info', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/');
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('AayuYukthi API');
  });

  it('GET /api/v1/health returns status envelope (db may be unreachable in CI)', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data).toHaveProperty('db');
  });

  it('GET /api/v1/health/heartbeat returns active status envelope and keepAliveInterval', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/health/heartbeat');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('active');
    expect(res.body.data.service).toBe('aayuyukthi-api');
    expect(res.body.data.keepAliveInterval).toBe('8m');
  });

  it('unknown route returns predictable NOT_FOUND envelope with request id', async () => {
    const app = createApp();
    const res = await request(app).get('/api/v1/nope');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.headers['x-request-id']).toBeTruthy();
  });
});
