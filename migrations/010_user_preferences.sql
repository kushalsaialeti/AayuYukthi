-- Phase 6: customer communication preferences + profile completion pointer.
-- Preferences stay schemaless JSONB (validated in the API layer) so new
-- channels don't require schema changes.

ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';
