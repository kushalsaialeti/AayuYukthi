-- Phase 15b: provider-independent media model (Cloudinary-first, migratable).
-- New uploads record provider + provider_asset_id; legacy rows (raw URLs)
-- stay readable as provider='external'. Binaries never live here.

ALTER TABLE media ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'external';
ALTER TABLE media ADD COLUMN IF NOT EXISTS provider_asset_id TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS resource_type TEXT NOT NULL DEFAULT 'image';
ALTER TABLE media ADD COLUMN IF NOT EXISTS original_filename TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS width INT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS height INT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS format TEXT;
ALTER TABLE media ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_status_check') THEN
    ALTER TABLE media ADD CONSTRAINT media_status_check CHECK (status IN ('active', 'archived'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS media_provider_asset_unique
  ON media (provider, provider_asset_id) WHERE provider_asset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS media_status_idx ON media (status);

-- The provider model references assets by provider_asset_id OR url;
-- legacy NOT NULLs on the raw columns no longer hold.
ALTER TABLE media ALTER COLUMN storage_key DROP NOT NULL;
ALTER TABLE media ALTER COLUMN url DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'media_reference_check') THEN
    ALTER TABLE media ADD CONSTRAINT media_reference_check CHECK (
      provider_asset_id IS NOT NULL OR url IS NOT NULL OR storage_key IS NOT NULL
    );
  END IF;
END $$;
