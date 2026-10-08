-- Phase 1: care recipients (people receiving hospital-journey support).
-- Sensitive free-text notes live here ONLY — never copied into analytics events.

CREATE TABLE IF NOT EXISTS care_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  relationship TEXT,
  date_of_birth DATE,
  gender TEXT,
  phone_e164 TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT care_recipients_gender_check CHECK (gender IS NULL OR gender IN ('female', 'male', 'other', 'prefer_not_to_say'))
);

CREATE INDEX IF NOT EXISTS care_recipients_owner_idx ON care_recipients (owner_user_id, created_at DESC);
