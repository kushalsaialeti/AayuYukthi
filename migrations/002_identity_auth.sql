-- Phase 1: identity & authentication foundation.
-- Roles, users, sessions, OTP codes. Passwords/OTPs stored hashed only.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Operational + customer roles (least privilege; no super-admin)
CREATE TABLE IF NOT EXISTS roles (
  name TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roles_name_check CHECK (name IN (
    'customer', 'operations_head', 'operations_staff', 'content_manager', 'analytics_viewer'
  ))
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone_e164 TEXT,
  password_hash TEXT,
  full_name TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  status TEXT NOT NULL DEFAULT 'active',
  email_verified_at TIMESTAMPTZ,
  phone_verified_at TIMESTAMPTZ,
  -- Onboarding progress pointer (powers user-level drop-off without PII in analytics)
  onboarding_last_step TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_contact_check CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL),
  CONSTRAINT users_locale_check CHECK (locale IN ('en', 'te')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'suspended', 'deleted'))
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique ON users (phone_e164) WHERE phone_e164 IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_status_idx ON users (status);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role TEXT NOT NULL REFERENCES roles (name) ON DELETE RESTRICT,
  assigned_by UUID REFERENCES users (id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles (role);

-- Refresh/session tokens: only hashes stored, never raw tokens
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL DEFAULT 'refresh',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_sessions_kind_check CHECK (kind IN ('refresh', 'recovery'))
);
CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions (user_id);

-- OTP codes: only hashes stored, never plain codes
CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT otp_codes_purpose_check CHECK (purpose IN ('signup', 'login', 'recovery'))
);
CREATE INDEX IF NOT EXISTS otp_codes_identifier_idx ON otp_codes (identifier, created_at DESC);
