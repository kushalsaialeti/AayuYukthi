-- Phase 15c: homepage design fields (all CMS-editable, all optional).
-- services.subtitle_en: card footer line ("From ₹499 / Visit", "Half-day & Full-day").
-- content_blocks.icon: Material Symbol name for trust/steps/pillar cards.
-- hero_slides.short_label_en: journey pill label ("Prep", "Travel", ...).

ALTER TABLE services ADD COLUMN IF NOT EXISTS subtitle_en TEXT NOT NULL DEFAULT '';
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE content_blocks ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE hero_slides ADD COLUMN IF NOT EXISTS short_label_en TEXT;
