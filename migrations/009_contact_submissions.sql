-- Phase 4: public contact-form submissions (triaged by operations in Phase 9).
-- No account required; status tracks handling.

CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone_e164 TEXT,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  handled_by UUID REFERENCES users (id) ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_submissions_contact_check CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL),
  CONSTRAINT contact_submissions_status_check CHECK (status IN ('new', 'in_review', 'responded', 'closed'))
);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions (status, created_at DESC);
