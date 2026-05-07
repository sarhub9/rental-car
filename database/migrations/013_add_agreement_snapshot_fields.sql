-- Migration 013: Add snapshot pricing fields to rental_agreements
-- Feature: 006-erp-core-upgrade (US2: Snapshot Pricing)
-- Constitution: X. Snapshot Integrity (NON-NEGOTIABLE)

ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS rate_plan_id UUID,
  ADD COLUMN IF NOT EXISTS rate_plan_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS snapshot_included_km INTEGER,
  ADD COLUMN IF NOT EXISTS snapshot_extra_km_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS snapshot_deposit_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS snapshot_fuel_policy JSONB,
  ADD COLUMN IF NOT EXISTS snapshot_late_return_rules JSONB,
  ADD COLUMN IF NOT EXISTS snapshot_add_ons JSONB,
  ADD COLUMN IF NOT EXISTS snapshot_terms_text TEXT;

COMMENT ON COLUMN rental_agreements.rate_plan_id IS 'Reference to rate_plan used at creation (informational only — snapshot fields are source of truth)';
COMMENT ON COLUMN rental_agreements.snapshot_included_km IS 'Total KM included for this agreement (frozen at creation)';
COMMENT ON COLUMN rental_agreements.snapshot_extra_km_rate IS 'Rate per extra KM (frozen at creation)';
COMMENT ON COLUMN rental_agreements.snapshot_deposit_amount IS 'Deposit amount (frozen at creation)';
COMMENT ON COLUMN rental_agreements.snapshot_fuel_policy IS 'Fuel policy JSON: {refill_rate, unit} (frozen at creation)';
COMMENT ON COLUMN rental_agreements.snapshot_late_return_rules IS 'Late return rules JSON: {grace_period_minutes, hourly_rate, daily_cap} (frozen at creation)';
COMMENT ON COLUMN rental_agreements.snapshot_add_ons IS 'Add-ons JSON array (frozen at creation)';
COMMENT ON COLUMN rental_agreements.snapshot_terms_text IS 'Terms and conditions text (frozen at creation)';

-- Immutability trigger: prevent snapshot field updates on non-DRAFT agreements
CREATE OR REPLACE FUNCTION prevent_snapshot_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'DRAFT' THEN
    IF (
      OLD.snapshot_included_km IS DISTINCT FROM NEW.snapshot_included_km OR
      OLD.snapshot_extra_km_rate IS DISTINCT FROM NEW.snapshot_extra_km_rate OR
      OLD.snapshot_deposit_amount IS DISTINCT FROM NEW.snapshot_deposit_amount OR
      OLD.snapshot_fuel_policy IS DISTINCT FROM NEW.snapshot_fuel_policy OR
      OLD.snapshot_late_return_rules IS DISTINCT FROM NEW.snapshot_late_return_rules OR
      OLD.snapshot_add_ons IS DISTINCT FROM NEW.snapshot_add_ons OR
      OLD.snapshot_terms_text IS DISTINCT FROM NEW.snapshot_terms_text OR
      OLD.rate_plan_id IS DISTINCT FROM NEW.rate_plan_id OR
      OLD.rate_plan_name IS DISTINCT FROM NEW.rate_plan_name
    ) THEN
      RAISE EXCEPTION 'Cannot modify snapshot fields on non-DRAFT agreement (ID: %)', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER prevent_agreement_snapshot_updates
    BEFORE UPDATE ON rental_agreements
    FOR EACH ROW
    EXECUTE FUNCTION prevent_snapshot_updates();
EXCEPTION WHEN duplicate_object THEN null; END $$;
