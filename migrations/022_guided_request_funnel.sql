-- Phase 22: Guided request engine funnel & draft step expansion
-- Expand draft step check constraint to support 1 to 12 steps in sequential question engine
ALTER TABLE request_drafts DROP CONSTRAINT IF EXISTS request_drafts_step_check;
ALTER TABLE request_drafts ADD CONSTRAINT request_drafts_step_check CHECK (current_step BETWEEN 1 AND 12);

-- Add optional dropoff and update notification recipients columns if not present
ALTER TABLE requests ADD COLUMN IF NOT EXISTS dropoff_address TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS update_phone TEXT;
