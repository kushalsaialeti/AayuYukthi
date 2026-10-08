-- Phase 10: translation cache for CMS content (English master, translated on demand).
-- Only public catalog content is cached here — never personal or medical data.
-- source_hash invalidates stale rows when editors change the English master.

CREATE TABLE IF NOT EXISTS translation_cache (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  field TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  target_locale TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'external',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id, field, target_locale)
);
CREATE INDEX IF NOT EXISTS translation_cache_lookup_idx
  ON translation_cache (entity_type, entity_id, field, target_locale);
