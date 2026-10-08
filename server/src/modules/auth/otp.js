import crypto from 'node:crypto';
import { httpError } from '../../middleware/errorHandler.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';
import { hashToken } from './tokens.js';
import { sendOtpEmail } from './email.js';

// OTP: 6-digit codes, SHA-256 hashes stored, 10-min TTL, 5 attempts.
// Delivery via Resend for real emails. Development code is NEVER returned in response.

const OTP_TTL_MINUTES = 10;
const testOtpTracker = new Map();

export function __getLatestOtpForTesting(channel) {
  return testOtpTracker.get(channel) || null;
}

export function generateOtpCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function channelOf({ email, phone_e164 }) {
  return email ?? phone_e164 ?? null;
}

export async function requestOtp(db, { identifier, purpose }) {
  let channel = (identifier.email ?? identifier.phone_e164 ?? identifier.identifier ?? '').trim();
  if (!channel) throw httpError(400, 'VALIDATION_ERROR', 'A contact channel is required');
  if (channel.includes('@')) channel = channel.toLowerCase();

  // For login/recovery the account must already exist; signup creates it first.
  if (purpose === 'login' || purpose === 'recovery') {
    const { rows } = await db.query(
      `SELECT id FROM users WHERE lower(email) = lower($1) OR phone_e164 = $1 LIMIT 1`,
      [channel],
    );
    if (!rows[0]) throw httpError(404, 'NOT_FOUND', 'No account found for these details');
  }

  // Invalidate older unconsumed codes for the channel+purpose (single active code).
  await db.query(
    `UPDATE otp_codes SET consumed_at = now() WHERE identifier = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [channel, purpose],
  );

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString();
  await db.query(
    `INSERT INTO otp_codes (identifier, code_hash, purpose, expires_at, max_attempts) VALUES ($1, $2, $3, $4, 4)`,
    [channel, hashToken(code), purpose, expiresAt],
  );

  // In test runs only, record the code in memory for test assertions
  if (env.isTest) {
    testOtpTracker.set(channel, code);
  }

  // If email channel, dispatch real email using Resend
  if (channel.includes('@')) {
    await sendOtpEmail({ email: channel, code, purpose });
  } else {
    logger.info({ channel: `${channel.slice(0, 3)}***`, purpose }, 'Phone OTP issued (SMS provider wiring pending)');
  }

  return {
    channel,
    purpose,
    expiresInSeconds: OTP_TTL_MINUTES * 60,
  };
}

export async function consumeOtp(db, { identifier, purpose, code }) {
  let channel = (identifier.email ?? identifier.phone_e164 ?? identifier.identifier ?? '').trim();
  if (!channel) throw httpError(400, 'VALIDATION_ERROR', 'A contact channel is required');
  if (channel.includes('@')) channel = channel.toLowerCase();
  const { rows } = await db.query(
    `SELECT id, code_hash, attempts, max_attempts, expires_at, consumed_at FROM otp_codes
     WHERE identifier = $1 AND purpose = $2 AND consumed_at IS NULL
     ORDER BY created_at DESC LIMIT 1`,
    [channel, purpose],
  );
  const row = rows[0];
  if (!row || new Date(row.expires_at) <= new Date()) {
    throw httpError(401, 'INVALID_OTP', 'This code is invalid or has expired');
  }
  const maxAttempts = row.max_attempts || 4;
  if (row.attempts >= maxAttempts) {
    const err = httpError(429, 'RATE_LIMITED', 'Too many failed attempts. Maximum 4 attempts exceeded. Please request a new code.');
    err.remainingAttempts = 0;
    throw err;
  }
  await db.query('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1', [row.id]);

  const ok = crypto.timingSafeEqual(Buffer.from(hashToken(code), 'hex'), Buffer.from(row.code_hash, 'hex'));
  if (!ok) {
    const remaining = Math.max(0, maxAttempts - (row.attempts + 1));
    if (remaining === 0) {
      const err = httpError(429, 'RATE_LIMITED', 'Too many failed attempts. Maximum 4 attempts exceeded. Please request a new code.');
      err.remainingAttempts = 0;
      throw err;
    }
    const err = httpError(401, 'INVALID_OTP', `Invalid OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    err.remainingAttempts = remaining;
    throw err;
  }

  await db.query('UPDATE otp_codes SET consumed_at = now() WHERE id = $1', [row.id]);
  return { channel };
}


export { channelOf };
