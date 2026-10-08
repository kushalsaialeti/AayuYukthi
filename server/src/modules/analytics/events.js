import { logger } from '../../config/logger.js';

// Fire-and-forget server-side event recording. Analytics must never break
// the product flow: every failure is swallowed into a log line.

// Events the public capture endpoint accepts (allowlist — nothing else lands).
export const CLIENT_EVENTS = new Set([
  'PAGE_VIEWED', 'CTA_CLICKED', 'SERVICE_VIEWED', 'SERVICE_SELECTED',
  'HOSPITAL_VIEWED', 'HOSPITAL_SEARCHED', 'HOSPITAL_SELECTED', 'SEARCH_PERFORMED',
  'HERO_VIEWED', 'NEED_SELECTOR_VIEWED', 'NEED_SELECTED', 'HOW_IT_WORKS_VIEWED',
  'LOGIN_STARTED', 'SIGNUP_STARTED', 'AUTH_STARTED', 'AUTH_COMPLETED',
  'REQUEST_STARTED', 'REQUEST_STEP_VIEWED', 'REQUEST_STEP_COMPLETED', 'REQUEST_STEP_BACK',
  'REQUEST_DRAFT_SAVED', 'REQUEST_DRAFT_RESUMED', 'REQUEST_REVIEWED',
  'REQUEST_SUBMITTED', 'REQUEST_SUBMISSION_FAILED', 'REQUEST_COMPLETED',
  'REQUEST_FAILED', 'REQUEST_CANCELLED',
  'language_selected', 'language_changed', 'LANGUAGE_CHANGED',
  'translation_requested', 'translation_failed', 'translation_cache_hit',
  'SUPPORT_REQUEST_CREATED', 'NOTIFICATION_VIEWED', 'CONTACT_INITIATED',
  'ONBOARDING_STEP_STARTED', 'ONBOARDING_STEP_COMPLETED',
]);

// Server-emitted milestones (backend flows; never from clients).
export const SERVER_EVENTS = new Set([
  'OTP_REQUESTED', 'OTP_VERIFIED', 'REGISTRATION_COMPLETED',
  'REQUEST_SUBMITTED', 'TRANSLATION_REQUESTED', 'TRANSLATION_FAILED',
]);

// Defense in depth: even allowlisted events get scrubbed. Never persist
// credentials, codes, tokens, payment data, or medical free text.
const FORBIDDEN_KEYS = new Set([
  'password', 'pass', 'otp', 'code', 'token', 'refreshToken', 'refresh_token',
  'payment', 'card', 'cvv', 'medical', 'notes', 'message', 'subject', 'address',
  'email', 'phone', 'phone_e164', 'name', 'full_name',
]);

export function scrubMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const out = {};
  const keys = Object.keys(input).slice(0, 20);
  for (const k of keys) {
    if (FORBIDDEN_KEYS.has(k) || FORBIDDEN_KEYS.has(k.toLowerCase())) continue;
    const v = input[k];
    if (v == null) continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      out[k] = typeof v === 'string' ? v.slice(0, 200) : v;
    }
  }
  return out;
}

export async function track(db, { eventName, userId = null, anonymousSessionId = null, page = null, source = null, deviceCategory = null, locale = null, metadata = {} }) {
  try {
    await db.query(
      `INSERT INTO analytics_events (event_name, anonymous_session_id, user_id, page, source, device_category, locale, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [eventName, anonymousSessionId, userId, page, source, deviceCategory, locale, JSON.stringify(scrubMetadata(metadata))],
    );
  } catch (err) {
    logger.error({ err: err.message, eventName }, 'Analytics recording failed (flow unaffected)');
  }
}
