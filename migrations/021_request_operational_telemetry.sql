-- Phase 21: Operational care details, telemetry, assigned companion phone/badge, doctor info, hospital care desk
ALTER TABLE requests ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS room_number TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS station_manager TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS station_location TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS station_intercom TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS station_phone TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS companion_phone TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS companion_badge_id TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS visit_summary TEXT;
ALTER TABLE requests ADD COLUMN IF NOT EXISTS telemetry_data JSONB DEFAULT '{}'::jsonb;
