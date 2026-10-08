-- =============================================================================
-- Migration 024: Supabase Keep-Alive Heartbeat Mechanism
-- Purpose:
--   Prevents Supabase free-tier projects from entering inactive sleep mode.
--   Executes an ultra-lightweight, negligible-impact retrieval query (sub-millisecond,
--   zero table locks, zero disk I/O bloat) that keeps database activity active.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public._supabase_heartbeat (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  last_pinged_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  ping_count BIGINT NOT NULL DEFAULT 1,
  CONSTRAINT single_row_heartbeat CHECK (id = 1)
);

-- Seed initial status row if not present
INSERT INTO public._supabase_heartbeat (id, last_pinged_at, ping_count)
VALUES (1, clock_timestamp(), 1)
ON CONFLICT (id) DO NOTHING;

-- Ultra-light retrieval function (STABLE SQL, sub-millisecond, negligible CPU/memory)
CREATE OR REPLACE FUNCTION public.keep_supabase_alive()
RETURNS TABLE(status text, pinged_at timestamptz)
LANGUAGE sql
STABLE
AS $$
  SELECT 'active'::text AS status, clock_timestamp() AS pinged_at;
$$;

-- In-database scheduled trigger via pg_cron (if extension is enabled in Supabase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('supabase-keep-alive-cron')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'supabase-keep-alive-cron');

    PERFORM cron.schedule(
      'supabase-keep-alive-cron',
      '*/8 * * * *',
      'SELECT status, pinged_at FROM public.keep_supabase_alive()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback cleanly if pg_cron is not enabled or lacks schema permissions
  NULL;
END $$;
