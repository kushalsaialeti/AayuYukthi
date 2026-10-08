import { logger } from '../config/logger.js';

// Rolls complete UTC days from raw events into analytics_daily_counts.
// Idempotent (re-running a day overwrites it). Run on a schedule in
// production (cron/scheduler in Phase 15); today is always computed live
// from raw events so dashboards stay fresh without rescanning history.

export async function runDailyAggregation(db, { upToDate = null } = {}) {
  const today = upToDate ?? new Date().toISOString().slice(0, 10);
  const { rows } = await db.query(
    `SELECT (occurred_at AT TIME ZONE 'UTC')::date AS day, event_name,
            COUNT(*)::bigint AS count, COUNT(DISTINCT user_id)::bigint AS user_count
     FROM analytics_events
     WHERE (occurred_at AT TIME ZONE 'UTC')::date < $1::date
     GROUP BY 1, 2`,
    [today],
  );
  let days = 0;
  for (const r of rows) {
    await db.query(
      `INSERT INTO analytics_daily_counts (day, event_name, count, user_count, updated_at)
       VALUES ($1,$2,$3,$4,now())
       ON CONFLICT (day, event_name) DO UPDATE SET count = $3, user_count = $4, updated_at = now()`,
      [r.day, r.event_name, r.count, r.user_count],
    );
    days += 1;
  }
  logger.info({ rows: days, upToDate: today }, 'Analytics aggregation complete');
  return { aggregated: days };
}
