-- Phase 1: analytics events + daily aggregates + append-only audit log.
-- PRIVACY: metadata must never contain passwords, OTPs, tokens, payment
-- credentials, medical records, or free-text medical information.
-- Use internal IDs, never raw PII, in event payloads.

CREATE TABLE IF NOT EXISTS analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  anonymous_session_id TEXT,
  user_id UUID REFERENCES users (id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  page TEXT,
  source TEXT,
  device_category TEXT,
  locale TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS analytics_events_name_time_idx ON analytics_events (event_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_user_idx ON analytics_events (user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events (anonymous_session_id, occurred_at DESC)
  WHERE anonymous_session_id IS NOT NULL;

-- Pre-aggregated counters so dashboards never scan raw events per request (Phase 11 fills this)
CREATE TABLE IF NOT EXISTS analytics_daily_counts (
  day DATE NOT NULL,
  event_name TEXT NOT NULL,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (day, event_name)
);

-- Append-only audit trail. No UPDATE/DELETE paths are exposed in the API (Phase 12).
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users (id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;
