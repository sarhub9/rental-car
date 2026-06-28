-- Migration 035: Additional driver details on rental agreements
-- Captured on the agreement and shown in the printed contract's
-- "Additional Driver" section.

ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS additional_driver_name           VARCHAR(200),
  ADD COLUMN IF NOT EXISTS additional_driver_license        VARCHAR(50),
  ADD COLUMN IF NOT EXISTS additional_driver_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS additional_driver_eid            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS additional_driver_dob            DATE;
