-- Phase 1: CMS catalog — media + services + hospitals + public content.
-- Media binaries live in object storage; DB stores keys/references only.

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_key TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INT,
  alt_text TEXT,
  entity_type TEXT,
  entity_id TEXT,
  uploaded_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT media_size_check CHECK (size_bytes IS NULL OR size_bytes > 0)
);
CREATE INDEX IF NOT EXISTS media_entity_idx ON media (entity_type, entity_id);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title_en TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  benefits_en TEXT[] NOT NULL DEFAULT '{}',
  image_media_id UUID REFERENCES media (id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT services_status_check CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS services_status_sort_idx ON services (status, sort_order) WHERE is_visible = true;

CREATE TABLE IF NOT EXISTS hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  address_en TEXT NOT NULL DEFAULT '',
  pincode TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  logo_media_id UUID REFERENCES media (id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT hospitals_status_check CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS hospitals_status_idx ON hospitals (status) WHERE is_visible = true;
CREATE INDEX IF NOT EXISTS hospitals_city_idx ON hospitals (city) WHERE status = 'published';

CREATE TABLE IF NOT EXISTS hospital_services (
  hospital_id UUID NOT NULL REFERENCES hospitals (id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE CASCADE,
  PRIMARY KEY (hospital_id, service_id)
);
CREATE INDEX IF NOT EXISTS hospital_services_service_idx ON hospital_services (service_id);

CREATE TABLE IF NOT EXISTS hero_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en TEXT NOT NULL,
  description_en TEXT NOT NULL DEFAULT '',
  image_media_id UUID REFERENCES media (id) ON DELETE SET NULL,
  primary_cta_label_en TEXT,
  primary_cta_url TEXT,
  secondary_cta_label_en TEXT,
  secondary_cta_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hero_slides_active_sort_idx ON hero_slides (sort_order) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en TEXT NOT NULL,
  answer_en TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  sort_order INT NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS faqs_published_idx ON faqs (category, sort_order) WHERE is_published = true;

CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name TEXT NOT NULL,
  author_detail_en TEXT NOT NULL DEFAULT '',
  quote_en TEXT NOT NULL,
  rating SMALLINT,
  image_media_id UUID REFERENCES media (id) ON DELETE SET NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT testimonials_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5))
);
CREATE INDEX IF NOT EXISTS testimonials_published_idx ON testimonials (sort_order) WHERE is_published = true;

-- Singleton contact settings (one row, id = 1)
CREATE TABLE IF NOT EXISTS contact_settings (
  id SMALLINT PRIMARY KEY,
  phone TEXT,
  email TEXT,
  address_en TEXT NOT NULL DEFAULT '',
  hours_en TEXT NOT NULL DEFAULT '',
  socials JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_settings_singleton CHECK (id = 1)
);

-- Flexible keyed content (about, footer, announcements) — structured keys, no giant pages blob
CREATE TABLE IF NOT EXISTS content_blocks (
  key TEXT PRIMARY KEY,
  title_en TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  updated_by UUID REFERENCES users (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT content_blocks_status_check CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS content_blocks_status_idx ON content_blocks (status);
