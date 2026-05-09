-- Migration 016: Add Agreement Snapshot Fields
-- Feature: Snapshot pricing at checkout (GOLDEN RULE — immutable after activation)
-- Date: 2026-02-27

ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS rate_plan_id UUID REFERENCES rate_plans(id),
  ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id),
  ADD COLUMN IF NOT EXISTS corporate_account_id UUID REFERENCES corporate_accounts(id),
  -- Snapshot fields captured at checkout — immutable once ACTIVE
  ADD COLUMN IF NOT EXISTS snapshot_daily_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS snapshot_weekly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS snapshot_km_allowance_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_extra_km_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS snapshot_fuel_policy VARCHAR(20),
  ADD COLUMN IF NOT EXISTS snapshot_late_fee_per_hour NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS snapshot_grace_period_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_vat_rate NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS snapshot_deposit_amount NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_approved_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for reservation linkage
CREATE INDEX IF NOT EXISTS idx_rental_agreements_reservation ON rental_agreements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_rate_plan ON rental_agreements(rate_plan_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_corporate ON rental_agreements(corporate_account_id);

COMMENT ON COLUMN rental_agreements.snapshot_daily_rate IS 'Rate captured at checkout — must NOT change after agreement is ACTIVE';
COMMENT ON COLUMN rental_agreements.snapshot_km_allowance_per_day IS 'KM allowance captured at checkout — immutable';
COMMENT ON COLUMN rental_agreements.discount_amount IS 'Approved discount amount; requires approval if exceeds threshold';
