-- Phase 17: hospital campus telemetry, highlight and feature tags for CMS and public catalog.
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS wait_info_en TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS campus_highlight_en TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS features_en TEXT[] DEFAULT '{}';
