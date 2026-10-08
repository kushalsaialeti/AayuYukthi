#!/usr/bin/env node
/**
 * Standalone Keep-Alive Ping Script
 *
 * Usage:
 *   node scripts/keep_alive_ping.js
 *   TARGET_URL=https://aayuyukthi-api.onrender.com node scripts/keep_alive_ping.js
 *
 * Executes a heartbeat ping against the target API endpoint:
 * - Wakes/keeps awake Render free-tier web services (<15m idle limit).
 * - Triggers an ultra-lightweight database query (SELECT 1) keeping Supabase from pausing.
 */

const target =
  process.env.TARGET_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  process.env.KEEP_ALIVE_URL ||
  'http://127.0.0.1:4000';

const cleanBase = target.replace(/\/+$/, '');
const endpoint = cleanBase.includes('/api/v1/health') ? cleanBase : `${cleanBase}/api/v1/health/heartbeat`;

console.log(`[KeepAlive] Sending 8-minute wake-up heartbeat to: ${endpoint}`);

const start = performance.now();
try {
  const res = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'User-Agent': 'AayuYukthi-KeepAlive-Cron/1.0',
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(20_000),
  });

  const duration = Math.round(performance.now() - start);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`[KeepAlive] Server returned error ${res.status} in ${duration}ms:`, data);
    process.exit(1);
  }

  console.log(`[KeepAlive] Heartbeat SUCCESS in ${duration}ms!`, JSON.stringify(data, null, 2));
  process.exit(0);
} catch (err) {
  console.error(`[KeepAlive] Ping failed after ${Math.round(performance.now() - start)}ms:`, err.message);
  process.exit(1);
}
