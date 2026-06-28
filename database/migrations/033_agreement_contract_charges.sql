-- Migration 033: Contract charge line-items on rental agreements
-- Adds the full set of charge fields shown on the printed rental contract
-- (Salik, Fines, Damages, Fuel, Extra KM, Delivery, Pickup, Extra Hour,
--  Other, Deposit, CDW, Excess Insurance, Deposit Waiver) plus remarks.
-- These are manual contract values; auto_generated_charges remain separate.

ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS salik_charges          NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fines_charges          NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS damages_charges        NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fuel_charges           NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_km_charges       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_charges       NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_charges         NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS extra_hour_charges     NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_charges          NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_amount         NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cdw_amount             NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excess_insurance_amount NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_waiver_amount  NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS additional_remarks     TEXT;

COMMENT ON COLUMN rental_agreements.salik_charges IS 'Contract: Salik / toll charges';
COMMENT ON COLUMN rental_agreements.cdw_amount IS 'Contract: Collision Damage Waiver';
COMMENT ON COLUMN rental_agreements.excess_insurance_amount IS 'Contract: Excess insurance';
COMMENT ON COLUMN rental_agreements.deposit_waiver_amount IS 'Contract: Deposit waiver';
COMMENT ON COLUMN rental_agreements.additional_remarks IS 'Contract: Additional remarks free text';
