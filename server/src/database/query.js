import { pool } from '../config/db.js';
import { logger } from '../config/logger.js';
import { httpError } from '../middleware/errorHandler.js';

const SLOW_QUERY_MS = 500;

// Convert Postgres errors into predictable API errors (never leak raw SQL).
export function translateDbError(err) {
  if (err?.code === '23505') return httpError(409, 'CONFLICT', 'A record with these unique details already exists');
  if (err?.code === '23503') return httpError(400, 'REFERENCE_NOT_FOUND', 'A referenced record does not exist');
  if (err?.code === '22P02') return httpError(400, 'INVALID_INPUT', 'Invalid input format');
  return err;
}

function isTransientConnectionError(err) {
  const msg = err?.message || '';
  const code = err?.code;
  return (
    code === 'ECONNRESET' ||
    code === 'EPIPE' ||
    code === 'ETIMEDOUT' ||
    msg.includes('Connection terminated unexpectedly') ||
    msg.includes('terminating connection') ||
    msg.includes('connection closed')
  );
}

// Single choke point for SQL: structured timing, slow-query warnings,
// and never logs parameter values (may contain PII).
export async function query(text, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const ms = Date.now() - start;
    if (ms >= SLOW_QUERY_MS) {
      logger.warn({ ms, rowCount: result.rowCount }, 'Slow query');
    }
    return result;
  } catch (err) {
    if (isTransientConnectionError(err) && typeof text === 'string' && text.trim().toUpperCase().startsWith('SELECT')) {
      logger.warn({ err: err.code ?? err.message }, 'Transient DB connection error on SELECT; retrying query once...');
      try {
        const retryResult = await pool.query(text, params);
        return retryResult;
      } catch (retryErr) {
        logger.error({ err: retryErr.code ?? retryErr.message }, 'Database retry failed');
        throw translateDbError(retryErr);
      }
    }
    logger.error({ err: err.code ?? err.message }, 'Database query failed');
    throw translateDbError(err);
  }
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw translateDbError(err);
  } finally {
    client.release();
  }
}

// Default DB handle injected into module routers (tests swap this for PGlite).
export const defaultDb = { query, withTransaction };
