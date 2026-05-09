-- Migration 015: Add Reservations
-- Feature: Full reservation workflow DRAFT→CONFIRMED→ASSIGNED→CHECKED_OUT
-- Date: 2026-02-27

CREATE TYPE reservation_status AS ENUM ('DRAFT','CONFIRMED','ASSIGNED','CHECKED_OUT','CANCELLED','NO_SHOW');
CREATE TYPE reservation_source AS ENUM ('ONLINE','COUNTER','PHONE','CORPORATE');

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  reservation_number VARCHAR(30) NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  vehicle_category_id UUID REFERENCES vehicle_categories(id),
  rate_plan_id UUID REFERENCES rate_plans(id),
  branch_id UUID REFERENCES branches(id),
  status reservation_status NOT NULL DEFAULT 'DRAFT',
  source reservation_source NOT NULL DEFAULT 'COUNTER',
  pickup_datetime TIMESTAMPTZ NOT NULL,
  return_datetime TIMESTAMPTZ NOT NULL,
  estimated_amount NUMERIC(10,2),
  deposit_required BOOLEAN NOT NULL DEFAULT FALSE,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  corporate_account_id UUID REFERENCES corporate_accounts(id),
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  agreement_id UUID REFERENCES rental_agreements(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, reservation_number),
  CONSTRAINT chk_reservation_dates CHECK (return_datetime > pickup_datetime),
  CONSTRAINT chk_reservation_vehicle_or_category CHECK (vehicle_id IS NOT NULL OR vehicle_category_id IS NOT NULL)
);

CREATE INDEX idx_reservations_tenant ON reservations(tenant_id);
CREATE INDEX idx_reservations_customer ON reservations(tenant_id, customer_id);
CREATE INDEX idx_reservations_status ON reservations(tenant_id, status);
CREATE INDEX idx_reservations_vehicle ON reservations(tenant_id, vehicle_id);
CREATE INDEX idx_reservations_dates ON reservations(tenant_id, pickup_datetime, return_datetime);

CREATE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Availability lock table to prevent double-booking
CREATE TABLE IF NOT EXISTS reservation_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  locked_from TIMESTAMPTZ NOT NULL,
  locked_to TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservation_locks_tenant_vehicle ON reservation_locks(tenant_id, vehicle_id, is_active);
CREATE INDEX idx_reservation_locks_reservation ON reservation_locks(reservation_id);

COMMENT ON TABLE reservations IS 'Vehicle reservation workflow before formal rental agreement';
COMMENT ON TABLE reservation_locks IS 'Availability locks to prevent double-booking during confirmed reservations';
