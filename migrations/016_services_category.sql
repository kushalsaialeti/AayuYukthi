-- Phase 16: service category field for filtering in public catalog and CMS.
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'outpatient';
