-- Phase 20: Rich hospital campus details, zones, meeting points, station lead, and logistics
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS tag_en TEXT DEFAULT 'Premier Healthcare Hub';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 4.9;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS assisted_visits_count TEXT DEFAULT '250+ assisted visits';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS campus_size_en TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS map_image_url TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS visiting_hours_en TEXT DEFAULT '10:00 AM – 12:00 PM | 05:00 PM – 07:00 PM';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS parking_info_en TEXT DEFAULT 'Valet & Visitor Parking Available at Main Gate';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS pharmacy_info_en TEXT DEFAULT '24/7 Pharmacy on Ground Floor';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS disclaimer_en TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS campus_guide_en TEXT DEFAULT '';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS zones JSONB DEFAULT '[]'::jsonb;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS meeting_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS specialized_services JSONB DEFAULT '[]'::jsonb;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS departments_en TEXT[] DEFAULT '{}';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS checklist_en TEXT[] DEFAULT '{}';
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS station_lead JSONB DEFAULT '{}'::jsonb;
