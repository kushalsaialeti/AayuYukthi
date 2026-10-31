-- 025: security event store + portal-wide unique user IDs + hot-path indexes.
-- Additive only.

-- Portal-wide unique human-readable ID. Generated in the DB so EVERY insert
-- path (customer signup, ops user creation, seeds) gets one automatically.
CREATE OR REPLACE FUNCTION gen_user_public_id() RETURNS text
LANGUAGE sql VOLATILE AS $$
  SELECT 'AY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
$$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS public_id text;

-- Backfill existing accounts before enforcing the constraint.
UPDATE users SET public_id = gen_user_public_id() WHERE public_id IS NULL;

ALTER TABLE users ALTER COLUMN public_id SET DEFAULT gen_user_public_id();
ALTER TABLE users ALTER COLUMN public_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_public_id_key') THEN
    ALTER TABLE users ADD CONSTRAINT users_public_id_key UNIQUE (public_id);
  END IF;
END $$;

-- Login/lookup hot path (lower(email)/phone) is already covered by the
-- partial uniques in 002 (users_email_unique / users_phone_unique) — no
-- duplicates added here.

-- Hot path gap from the audit: submit/draft flows filter by recipient.
CREATE INDEX IF NOT EXISTS requests_recipient_idx ON requests (recipient_id)
  WHERE recipient_id IS NOT NULL;

-- Dashboard date filters run (occurred_at AT TIME ZONE 'UTC')::date — an
-- expression index makes that predicate sargable instead of a full scan.
CREATE INDEX IF NOT EXISTS analytics_events_name_date_idx
  ON analytics_events (event_name, ((occurred_at AT TIME ZONE 'UTC')::date));

-- Security event store: attack attempts, auth failures, rate-limit floods.
-- Written best-effort by the security monitor; surfaced in Operations.
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'high' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  method text,
  path text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_events_created_idx ON security_events (created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_type_idx ON security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_severity_idx
  ON security_events (severity, created_at DESC) WHERE severity IN ('high', 'critical');
