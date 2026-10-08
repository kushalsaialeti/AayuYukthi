-- Phase 0: foundation check. Real domain tables arrive in Phase 1.
-- This migration proves the migrate runner + DB connectivity work.
CREATE TABLE IF NOT EXISTS _foundation_check (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
