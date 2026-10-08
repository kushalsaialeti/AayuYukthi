import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { pingSupabaseHeartbeat } from '../config/db.js';

let keepAliveTimer = null;

/**
 * Runs a single keep-alive heartbeat cycle:
 * 1. Executes an ultra-lightweight database query (SELECT 1) to keep Supabase active.
 * 2. If an external URL is set (e.g. Render external URL), issues an HTTP GET request
 *    to reset Render's 15-minute idle spin-down timer.
 */
export async function runKeepAliveHeartbeat(targetUrl = null) {
  const result = {
    timestamp: new Date().toISOString(),
    db: { ok: false },
    http: { ok: false, skipped: true },
  };

  // 1. Supabase database lightweight query (<0.2ms, negligible CPU, prevents 7-day auto-pause)
  try {
    const dbPing = await pingSupabaseHeartbeat();
    result.db = dbPing;
  } catch (err) {
    result.db = { ok: false, error: err.message };
    logger.warn({ err: err.message }, 'Supabase keep-alive database heartbeat failed');
  }

  // 2. Render HTTP Ping (resets 15-min idle spin-down timer)
  const pingUrl = targetUrl || env.KEEP_ALIVE_URL || env.RENDER_EXTERNAL_URL;
  if (pingUrl) {
    result.http.skipped = false;
    const cleanUrl = pingUrl.replace(/\/+$/, '');
    const endpoint = cleanUrl.includes('/api/v1/health') ? cleanUrl : `${cleanUrl}/api/v1/health/heartbeat`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'User-Agent': 'AayuYukthi-KeepAlive/1.0',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      });

      result.http.ok = response.ok;
      result.http.status = response.status;
      result.http.endpoint = endpoint;
    } catch (httpErr) {
      result.http.ok = false;
      result.http.error = httpErr.message;
      logger.warn({ err: httpErr.message, endpoint }, 'Render keep-alive HTTP ping failed');
    }
  }

  logger.info(
    {
      dbOk: result.db.ok,
      httpOk: result.http.ok,
      httpSkipped: result.http.skipped,
      pingUrl: pingUrl || 'none (in-process db heartbeat only)',
    },
    'Keep-alive heartbeat completed (Render + Supabase sleep prevention)'
  );

  return result;
}

/**
 * Starts the keep-alive scheduler (default: runs every 8 minutes).
 */
export function startKeepAliveService() {
  if (env.isTest || env.KEEP_ALIVE_DISABLED) {
    return null;
  }

  const intervalMs = env.KEEP_ALIVE_INTERVAL_MINUTES * 60 * 1000; // 8 minutes = 480,000ms

  logger.info(
    {
      intervalMinutes: env.KEEP_ALIVE_INTERVAL_MINUTES,
      hasExternalUrl: Boolean(env.RENDER_EXTERNAL_URL || env.KEEP_ALIVE_URL),
    },
    'Starting automated 8-minute keep-alive service'
  );

  // Initial light verification after 15 seconds to ensure DB readiness without blocking boot
  const initialTimeout = setTimeout(() => {
    runKeepAliveHeartbeat().catch(() => {});
  }, 15_000);
  initialTimeout.unref?.();

  // Recurring 8-minute interval
  keepAliveTimer = setInterval(() => {
    runKeepAliveHeartbeat().catch((err) => {
      logger.error({ err }, 'Error during recurring keep-alive tick');
    });
  }, intervalMs);

  keepAliveTimer.unref?.();
  return keepAliveTimer;
}

export function stopKeepAliveService() {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}
