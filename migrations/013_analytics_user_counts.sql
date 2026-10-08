-- Phase 11: distinct-user counts on daily aggregates (V1 aggregation target).
ALTER TABLE analytics_daily_counts ADD COLUMN IF NOT EXISTS user_count BIGINT NOT NULL DEFAULT 0;
