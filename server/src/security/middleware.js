// Security monitor middleware: scans every request for attack signatures,
// records what it finds, and answers blocked attackers with a taunt instead of
// a useful error (the "joker" response). Also provides a rate-limit handler
// so flooded/blocked requests get the same treatment and admin escalation.

import { scanRequest } from './signatures.js';
import { recordSecurityEvent } from './events.js';

// Taunt responses shown to the blocked requester (frontend turns these into a
// popup; direct API callers see the JSON). One is picked per request.
const JOKER_MESSAGES = [
  "🃏 Nice try, hacker. That trick doesn't work here — your attempt has been logged and our security team has been alerted. Better luck next life!",
  "🃏 Woah there, Sherlock. We saw that from a mile away. Screenshot secured, IP saved, admin notified. Try again? Don't.",
  "🃏 Error 404: talent not found. Your little probe has been recorded and forwarded to the humans with the red dashboards. Have a great day!",
  "🃏 Congrats — you just triggered our alarm. Your request has been archived in our museum of failed attacks. 🎉",
];

export function jokerMessage() {
  return JOKER_MESSAGES[Math.floor(Math.random() * JOKER_MESSAGES.length)];
}

/**
 * Express middleware. Mount AFTER body parsing (so bodies are scannable) and
 * BEFORE routes. Never throws.
 */
export function securityMonitor(db) {
  return async (req, res, next) => {
    try {
      // OPTIONS preflights and health checks are never attacks.
      if (req.method === 'OPTIONS' || req.path === '/health') return next();

      const matches = scanRequest(req);
      if (!matches) return next();

      // URL/query/header matches = recon or injection probes → always block.
      // Body-only matches on AUTHENTICATED sessions are recorded but allowed:
      // legitimate free text (support messages, pickup notes) must never be
      // locked out by a false positive — React/parameterized SQL defuse it.
      const hard = matches.filter((m) => m.source !== 'body');
      const bodyOnly = matches.filter((m) => m.source === 'body');
      const authenticated = Boolean(req.headers.authorization);
      const shouldBlock = hard.length > 0 || (bodyOnly.length > 0 && !authenticated);

      const detail = { signatures: matches.map((m) => `${m.type}:${m.source}`), samples: matches.map((m) => m.sample) };
      const severity = matches.some((m) => m.severity === 'critical') ? 'critical' : 'high';

      if (!shouldBlock) {
        // Logged-only: suspicious input from a signed-in session.
        recordSecurityEvent(db, {
          eventType: 'SUSPICIOUS_INPUT',
          severity: 'low',
          ip: req.ip ?? null,
          method: req.method,
          path: req.originalUrl?.slice(0, 300) ?? null,
          detail,
          requestId: req.requestId ?? null,
        });
        return next();
      }

      // Persist BEFORE responding (insert only — alert email is async), so the
      // event is durably on record when the taunt goes out.
      await recordSecurityEvent(db, {
        eventType: hard.length ? matches.find((m) => m.source !== 'body').type : matches[0].type,
        severity,
        ip: req.ip ?? null,
        method: req.method,
        path: req.originalUrl?.slice(0, 300) ?? null,
        detail,
        requestId: req.requestId ?? null,
      });

      return res.status(403).json({
        code: 'SECURITY_BLOCKED',
        message: jokerMessage(),
        requestId: req.requestId ?? null,
      });
    } catch {
      // Fail open: a scanner bug must not take the API down.
      return next();
    }
  };
}

// ---------------------------------------------------------------------------
// Rate-limiter escalation: configured once per app instance in createApp().
// ---------------------------------------------------------------------------
let limiterSink = null;

/** @param {(event: object) => void} fn */
export function setLimiterSink(fn) {
  limiterSink = fn;
}

/**
 * Shared express-rate-limit handler: taunt + record + escalate.
 * @param {string} eventType
 */
export function rateLimitHandler(eventType) {
  return (req, res) => {
    limiterSink?.({
      eventType,
      severity: 'medium',
      ip: req.ip ?? null,
      method: req.method,
      path: req.originalUrl?.slice(0, 300) ?? null,
      detail: { windowMs: req.rateLimit?.windowMs, limit: req.rateLimit?.limit, remaining: req.rateLimit?.remaining },
      requestId: req.requestId ?? null,
    });
    res.status(429).json({
      code: 'RATE_LIMITED',
      message: `🃏 Slow down! You've hit your limit — we're counting, and the admin has been notified. Try again shortly.`,
      requestId: req.requestId ?? null,
    });
  };
}
