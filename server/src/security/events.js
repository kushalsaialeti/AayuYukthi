// Security event recording + RED ALERT escalation.
// Every suspicious event is persisted to security_events (viewable in
// Operations → Security). High/critical events additionally escalate:
//   1. a FATAL log line with a visible banner (always), and
//   2. an email to SECURITY_ADMIN_EMAIL (when configured), throttled to one
//      alert per event-type+IP per 10 minutes so an attacker cannot flood the
//      admin inbox on top of attacking the API.
//
// Recording is best-effort and MUST never throw into the request path.

import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { dispatch } from '../modules/notify/providers.js';

const ALERT_WINDOW_MS = 10 * 60_000;
const lastAlertAt = new Map();

// Periodic prune so a long-lived process cannot grow the throttle map forever.
setInterval(() => {
  const now = Date.now();
  for (const [key, at] of lastAlertAt) {
    if (now - at > ALERT_WINDOW_MS) lastAlertAt.delete(key);
  }
}, ALERT_WINDOW_MS).unref?.();

function shouldAlert(key) {
  const now = Date.now();
  const last = lastAlertAt.get(key) ?? 0;
  if (now - last < ALERT_WINDOW_MS) return false;
  lastAlertAt.set(key, now);
  return true;
}

/**
 * Persist a security event and escalate high-severity ones to the admin.
 * @param {import('pg').Pool | any} db
 * @param {{eventType: string, severity?: string, ip?: string|null, userId?: string|null,
 *          method?: string|null, path?: string|null, detail?: object, requestId?: string|null}} event
 */
export async function recordSecurityEvent(db, event) {
  const severity = event.severity ?? 'high';
  const detail = event.detail ?? {};

  try {
    if (db?.query) {
      await db.query(
        `INSERT INTO security_events (event_type, severity, ip, user_id, method, path, detail, request_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
        [
          event.eventType,
          severity,
          event.ip ?? null,
          event.userId ?? null,
          event.method ?? null,
          event.path ?? null,
          JSON.stringify(detail),
          event.requestId ?? null,
        ],
      );
    }
  } catch (err) {
    // Losing an event row must never break serving; log it loudly instead.
    logger.error({ err: err.message, eventType: event.eventType }, 'security_events insert failed');
  }

  if (severity !== 'high' && severity !== 'critical') return;

  const banner = severity === 'critical' ? '🔴🔴 RED ALERT — CRITICAL' : '🔴 RED ALERT — SECURITY EVENT';
  logger.fatal(
    { eventType: event.eventType, severity, ip: event.ip, path: event.path, requestId: event.requestId, userId: event.userId },
    `${banner}: ${event.eventType}`,
  );

  const key = `${event.eventType}:${event.ip ?? 'na'}`;
  if (!shouldAlert(key)) return; // throttled: DB row still written above

  const alertEmail = env.securityAdminEmail;
  if (!alertEmail) return; // no recipient configured → ops Security page + logs carry it

  const lines = [
    `AayuYukthi API blocked a suspicious request.`,
    ``,
    `Severity : ${severity}`,
    `Event    : ${event.eventType}`,
    `IP       : ${event.ip ?? 'unknown'}`,
    `Method   : ${event.method ?? '-'} ${event.path ?? '-'}`,
    `Time     : ${new Date().toISOString()}`,
    `RequestID: ${event.requestId ?? '-'}`,
    `Details  : ${JSON.stringify(detail).slice(0, 500)}`,
    ``,
    `Review: Operations → Security → Events`,
  ];
  // Email dispatch is fire-and-forget: the DB row + FATAL log above are the
  // guaranteed record; SMTP latency must never delay the blocked response.
  dispatch({
    channel: 'email',
    to: alertEmail,
    title: `${banner}: ${event.eventType}`,
    body: lines.join('\n'),
  }).catch(() => {});
}

/** Test seam: inspect/replace the alert throttle state. */
export function _resetAlertThrottle() {
  lastAlertAt.clear();
}

/** Mask an email/phone for security-event detail — raw identifiers of failed
 * login attempts are never persisted (the event row already carries the IP). */
export function maskIdentifier(value) {
  if (!value || typeof value !== 'string') return null;
  if (value.includes('@')) {
    const [name = '', domain = ''] = value.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return `${value.slice(0, 3)}***`;
}
