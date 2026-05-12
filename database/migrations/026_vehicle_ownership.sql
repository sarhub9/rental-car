-- Migration 026: Vehicle Ownership + Tracking Fields
-- Date: 2026-05-12

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS ownership_type       VARCHAR(30)   DEFAULT 'COMPANY'
    CHECK (ownership_type IN ('COMPANY','INVESTOR_OWNED','LEASED','FINANCED')),
  ADD COLUMN IF NOT EXISTS investor_name        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS purchase_date        DATE,
  ADD COLUMN IF NOT EXISTS purchase_price       NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS supplier_name        VARCHAR(200),
  ADD COLUMN IF NOT EXISTS finance_company      VARCHAR(200),
  ADD COLUMN IF NOT EXISTS monthly_payment      NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS finance_end_date     DATE,
  ADD COLUMN IF NOT EXISTS salik_tag_number     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gps_device_imei      VARCHAR(50),
  ADD COLUMN IF NOT EXISTS gps_provider         VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fuel_card_number     VARCHAR(50),
  ADD COLUMN IF NOT EXISTS parking_location     VARCHAR(200),
  ADD COLUMN IF NOT EXISTS cleaning_status      VARCHAR(20)   DEFAULT 'CLEAN'
    CHECK (cleaning_status IN ('CLEAN','NEEDS_CLEANING','IN_CLEANING'));

COMMENT ON COLUMN vehicles.ownership_type    IS 'How the vehicle is owned/financed';
COMMENT ON COLUMN vehicles.salik_tag_number  IS 'Dubai RTA Salik tag for toll attribution';
COMMENT ON COLUMN vehicles.gps_device_imei   IS 'GPS tracker device IMEI number';
