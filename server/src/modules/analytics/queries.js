import { z } from 'zod';

// Dashboards read pre-aggregated daily counts for complete days and only
// scan raw events for the live tail (today) — never full history per request.

export const rangeQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().int().min(1).max(90).optional(),
});

export function resolveRange(query) {
  const to = query.to ?? new Date().toISOString().slice(0, 10);
  const from = query.from ?? new Date(new Date(`${to}T00:00:00Z`).getTime() - (query.days ?? 30) * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

const todayISO = () => new Date().toISOString().slice(0, 10);

// NOTE: ranges compare in UTC-date space ((occurred_at AT TIME ZONE 'UTC')::date)
// rather than timestamptz arithmetic. Correct on real Postgres and portable;
// at V1 scale the bounded scans stay cheap via the (event_name, occurred_at)
// index. If raw events ever outgrow that, add a generated occurred_day column
// (indexed) instead of widening the scan.
const DAY = `(occurred_at AT TIME ZONE 'UTC')::date`;

// Sum counts for events over [from, to]: aggregates for complete days,
// bounded raw scan for the live tail only.
export async function sumCounts(db, eventNames, { from, to }) {
  const today = todayISO();
  const out = {};
  for (const e of eventNames) out[e] = 0;
  if (!eventNames.length) return out;

  const aggCutoff = to < today ? to : new Date(new Date(`${today}T00:00:00Z`).getTime() - 86400000).toISOString().slice(0, 10);
  if (aggCutoff >= from) {
    const { rows } = await db.query(
      `SELECT event_name, SUM(count)::bigint AS count FROM analytics_daily_counts
       WHERE day >= $1::date AND day <= $2::date AND event_name = ANY($3::text[]) GROUP BY event_name`,
      [from, aggCutoff, eventNames],
    );
    for (const r of rows) out[r.event_name] = Number(r.count);
  }
  const liveFrom = aggCutoff >= from ? new Date(new Date(`${aggCutoff}T00:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10) : from;
  if (liveFrom <= to) {
    const { rows } = await db.query(
      `SELECT event_name, COUNT(*)::bigint AS count FROM analytics_events
       WHERE event_name = ANY($1::text[]) AND ${DAY} >= $2::date AND ${DAY} <= $3::date
       GROUP BY event_name`,
      [eventNames, liveFrom, to],
    );
    for (const r of rows) out[r.event_name] = (out[r.event_name] ?? 0) + Number(r.count);
  }
  return out;
}

const FUNNELS = {
  signup: ['SIGNUP_STARTED', 'OTP_REQUESTED', 'OTP_VERIFIED'],
  onboarding: ['SIGNUP_STARTED', 'OTP_REQUESTED', 'OTP_VERIFIED', 'REGISTRATION_COMPLETED'],
  request: ['REQUEST_STARTED', 'REQUEST_STEP_COMPLETED', 'REQUEST_SUBMITTED'],
  overall: ['PAGE_VIEWED', 'SIGNUP_STARTED', 'OTP_VERIFIED', 'REGISTRATION_COMPLETED', 'REQUEST_STARTED', 'REQUEST_SUBMITTED'],
};

export async function funnel(db, type, range) {
  const steps = FUNNELS[type] ?? FUNNELS.onboarding;
  const counts = await sumCounts(db, steps, range);
  return steps.map((event, i) => {
    const count = counts[event] ?? 0;
    const prev = i === 0 ? null : (counts[steps[i - 1]] ?? 0);
    return {
      event,
      count,
      conversionFromPrevious: prev ? (prev === 0 ? 0 : Math.round((count / prev) * 1000) / 10) : null,
      dropped: prev == null ? 0 : Math.max(0, prev - count),
    };
  });
}

export async function overview(db, range) {
  const events = ['PAGE_VIEWED', 'SIGNUP_STARTED', 'OTP_REQUESTED', 'OTP_VERIFIED',
    'REGISTRATION_COMPLETED', 'REQUEST_STARTED', 'REQUEST_SUBMITTED', 'SUPPORT_REQUEST_CREATED',
    'LANGUAGE_CHANGED', 'TRANSLATION_REQUESTED'];
  const counts = await sumCounts(db, events, range);

  // Visitors: distinct anonymous sessions + authenticated users (bounded raw scan).
  const { rows } = await db.query(
    `SELECT COUNT(DISTINCT anonymous_session_id)::bigint AS anon,
            COUNT(DISTINCT user_id)::bigint AS authed
     FROM analytics_events
     WHERE ${DAY} >= $1::date AND ${DAY} <= $2::date`,
    [range.from, range.to],
  );
  return {
    range,
    visitors: { anonymousSessions: Number(rows[0]?.anon ?? 0), authenticatedUsers: Number(rows[0]?.authed ?? 0) },
    counts,
  };
}

// User-level drop-off: internal IDs + last step + timestamp only.
// No names, emails, OTPs, or message content — ever.
export async function dropoff(db, { limit = 50 }) {
  const byStep = (await db.query(
    `SELECT onboarding_last_step AS step, COUNT(*)::int AS count FROM users
     WHERE onboarding_completed_at IS NULL AND onboarding_last_step IS NOT NULL
     GROUP BY onboarding_last_step ORDER BY count DESC`,
    [])).rows;
  const { rows } = await db.query(
    `SELECT id, onboarding_last_step AS last_step, updated_at AS last_seen
     FROM users WHERE onboarding_completed_at IS NULL AND onboarding_last_step IS NOT NULL
     ORDER BY updated_at DESC LIMIT $1`,
    [Math.min(limit, 100)],
  );
  return { byStep, stuck: rows };
}

export async function topByMetadata(db, { event, key, range, limit = 10 }) {
  const { rows } = await db.query(
    `SELECT metadata->>$3 AS slug, COUNT(*)::bigint AS count
     FROM analytics_events
     WHERE event_name = $1 AND ${DAY} >= $2::date AND ${DAY} <= $4::date
       AND metadata->>$3 IS NOT NULL
     GROUP BY slug ORDER BY count DESC LIMIT $5`,
    [event, range.from, key, range.to, Math.min(limit, 25)],
  );
  return rows.map((r) => ({ slug: r.slug, count: Number(r.count) }));
}

export async function languageSplit(db, range) {
  const { rows } = await db.query(
    `SELECT locale, COUNT(*)::bigint AS count FROM analytics_events
     WHERE ${DAY} >= $1::date AND ${DAY} <= $2::date
       AND locale IS NOT NULL AND event_name = 'PAGE_VIEWED'
     GROUP BY locale ORDER BY count DESC`,
    [range.from, range.to],
  );
  return rows.map((r) => ({ locale: r.locale, count: Number(r.count) }));
}

export async function recentEvents(db, { page, limit }) {
  const total = (await db.query('SELECT COUNT(*)::int AS count FROM analytics_events')).rows[0].count;
  const { rows } = await db.query(
    `SELECT id, event_name, anonymous_session_id, user_id, occurred_at, page, locale, metadata
     FROM analytics_events ORDER BY id DESC LIMIT $1 OFFSET $2`,
    [limit, (page - 1) * limit],
  );
  return { items: rows, total };
}

export { FUNNELS };
