-- Migration 030: Monthly rate + KM allowance on vehicles and rental agreements
-- Enables automatic daily/weekly/monthly tiered pricing and "allowed KM" capture.

-- ============================================================================
-- VEHICLES — used to auto-fill rates when creating an agreement
-- ============================================================================
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS monthly_rate         DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS km_allowance_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS rate_per_extra_km    DECIMAL(10,2);

-- ============================================================================
-- RENTAL AGREEMENTS — persist the chosen monthly rate + allowed KM
-- ============================================================================
ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS monthly_rate         DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS km_allowance_per_day INTEGER,
  ADD COLUMN IF NOT EXISTS rate_per_extra_km    DECIMAL(10,2);
