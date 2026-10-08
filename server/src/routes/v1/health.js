import { Router } from 'express';
import { checkDb, pingSupabaseHeartbeat } from '../../config/db.js';

const router = Router();

router.get('/health', async (_req, res) => {
  let db = { ok: false };
  try {
    db = await checkDb();
  } catch (err) {
    db = { ok: false, error: err.code ?? 'DB_UNREACHABLE' };
  }
  res.json({
    data: {
      status: 'ok',
      service: 'aayuyukthi-api',
      version: 'v1',
      time: new Date().toISOString(),
      db,
    },
  });
});

// Dedicated lightweight keep-alive heartbeat endpoint
// Sub-millisecond execution, resets Render idle timer & Supabase 7-day auto-pause timer
router.get(['/health/heartbeat', '/health/ping'], async (_req, res) => {
  const start = performance.now();
  let db = { ok: false };
  try {
    db = await pingSupabaseHeartbeat();
  } catch (err) {
    db = { ok: false, error: err.code ?? 'DB_UNREACHABLE' };
  }
  const durationMs = Math.round((performance.now() - start) * 100) / 100;
  res.json({
    data: {
      status: 'active',
      service: 'aayuyukthi-api',
      time: new Date().toISOString(),
      latencyMs: durationMs,
      supabase: db.ok ? 'active' : 'unreachable',
      keepAliveInterval: '8m',
    },
  });
});

export default router;
