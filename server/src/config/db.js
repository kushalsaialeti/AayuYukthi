import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from './logger.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.PG_POOL_MAX,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected postgres pool error');
});

export async function checkDb() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return { ok: true };
  } finally {
    client.release();
  }
}

export async function pingSupabaseHeartbeat() {
  const client = await pool.connect();
  try {
    // Ultra-light retrieval query (sub-millisecond, 0 disk I/O, keeps Supabase connection active)
    const result = await client.query('SELECT 1 AS keep_alive, clock_timestamp() AS pinged_at');
    return { ok: true, pingedAt: result.rows[0]?.pinged_at };
  } finally {
    client.release();
  }
}
