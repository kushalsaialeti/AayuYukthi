-- Phase 18: Direct image and logo URLs for hospitals and services (WebP CDN & direct uploads)
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
