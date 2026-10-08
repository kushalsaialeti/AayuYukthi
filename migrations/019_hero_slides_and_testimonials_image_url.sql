-- Phase 19: Direct image URLs for hero_slides and testimonials (WebP CDN & direct uploads)
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image_url TEXT;
