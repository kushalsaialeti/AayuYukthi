-- Phase 1: care requests + controlled status history.
-- Status values are closed sets (CHECK), never arbitrary text.
-- Internal notes and customer-facing messages are separate columns.

CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  recipient_id UUID NOT NULL REFERENCES care_recipients (id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES services (id) ON DELETE RESTRICT,
  hospital_id UUID NOT NULL REFERENCES hospitals (id) ON DELETE RESTRICT,
  appointment_type TEXT,
  appointment_date DATE,
  schedule_at TIMESTAMPTZ,
  pickup_required BOOLEAN NOT NULL DEFAULT false,
  pickup_address TEXT,
  additional_requirements TEXT,
  status TEXT NOT NULL DEFAULT 'REQUEST_RECEIVED',
  assigned_to UUID REFERENCES users (id) ON DELETE SET NULL,
  idempotency_key TEXT,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT requests_status_check CHECK (status IN (
    'REQUEST_RECEIVED', 'UNDER_REVIEW', 'COORDINATION_IN_PROGRESS', 'CONFIRMED',
    'SCHEDULED', 'SERVICE_IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ACTION_REQUIRED'
  ))
);

CREATE UNIQUE INDEX IF NOT EXISTS requests_idempotency_unique
  ON requests (owner_user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS requests_owner_idx ON requests (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS requests_status_idx ON requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS requests_schedule_idx ON requests (schedule_at) WHERE schedule_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS requests_assigned_idx ON requests (assigned_to) WHERE assigned_to IS NOT NULL;

CREATE TABLE IF NOT EXISTS request_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES requests (id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users (id) ON DELETE SET NULL,
  note_internal TEXT,
  customer_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT request_status_history_to_check CHECK (to_status IN (
    'REQUEST_RECEIVED', 'UNDER_REVIEW', 'COORDINATION_IN_PROGRESS', 'CONFIRMED',
    'SCHEDULED', 'SERVICE_IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ACTION_REQUIRED'
  ))
);
CREATE INDEX IF NOT EXISTS request_status_history_request_idx
  ON request_status_history (request_id, created_at DESC);
