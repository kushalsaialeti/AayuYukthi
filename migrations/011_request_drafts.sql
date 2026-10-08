-- Phase 7: request drafts (wizard state survives navigation/refresh).
-- One draft per owner+key; submitting deletes the draft and creates the request.

CREATE TABLE IF NOT EXISTS request_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  current_step INT NOT NULL DEFAULT 1,
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT request_drafts_step_check CHECK (current_step BETWEEN 1 AND 10)
);
CREATE UNIQUE INDEX IF NOT EXISTS request_drafts_owner_key_unique ON request_drafts (owner_user_id, idempotency_key);
