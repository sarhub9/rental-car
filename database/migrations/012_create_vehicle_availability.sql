-- Migration 012: Create vehicle_availability table
-- Feature: 006-erp-core-upgrade (US1: Availability Lock)
-- Constitution: XI. Availability & Booking Integrity (NON-NEGOTIABLE)

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$ BEGIN
  CREATE TYPE availability_lock_type AS ENUM ('reservation', 'rental', 'maintenance');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS vehicle_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  agreement_id UUID REFERENCES rental_agreements(id),
  lock_start TIMESTAMPTZ NOT NULL,
  lock_end TIMESTAMPTZ NOT NULL,
  lock_type availability_lock_type NOT NULL,
  created_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT va_date_check CHECK (lock_end > lock_start),
  EXCLUDE USING gist (
    vehicle_id WITH =,
    tstzrange(lock_start, lock_end) WITH &&
  )
);

CREATE INDEX IF NOT EXISTS idx_va_tenant ON vehicle_availability(tenant_id);
CREATE INDEX IF NOT EXISTS idx_va_vehicle ON vehicle_availability(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_va_vehicle_dates ON vehicle_availability(vehicle_id, lock_start, lock_end);
CREATE INDEX IF NOT EXISTS idx_va_agreement ON vehicle_availability(agreement_id);
CREATE INDEX IF NOT EXISTS idx_va_lock_type ON vehicle_availability(lock_type);

COMMENT ON TABLE vehicle_availability IS 'DB-level availability lock preventing double-booking via GiST exclusion constraint';
COMMENT ON CONSTRAINT va_date_check ON vehicle_availability IS 'Lock end must be after lock start';
