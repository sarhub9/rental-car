-- Migration 025: Company Profile + Enhanced Settings
-- Date: 2026-05-12

-- Extend companies table with full profile
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS name_ar               VARCHAR(200),
  ADD COLUMN IF NOT EXISTS trn_number            VARCHAR(50),
  ADD COLUMN IF NOT EXISTS vat_rate              NUMERIC(5,2)  NOT NULL DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS currency              VARCHAR(10)   NOT NULL DEFAULT 'AED',
  ADD COLUMN IF NOT EXISTS invoice_prefix        VARCHAR(20)   DEFAULT 'INV',
  ADD COLUMN IF NOT EXISTS invoice_footer        TEXT,
  ADD COLUMN IF NOT EXISTS agreement_terms       TEXT,
  ADD COLUMN IF NOT EXISTS website               VARCHAR(200),
  ADD COLUMN IF NOT EXISTS city                  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country               VARCHAR(100)  DEFAULT 'UAE',
  ADD COLUMN IF NOT EXISTS invoice_next_number   INTEGER       NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS receipt_next_number   INTEGER       NOT NULL DEFAULT 1;

-- Extend tenant_rules with more settings
ALTER TABLE tenant_rules
  ADD COLUMN IF NOT EXISTS vat_rate                      NUMERIC(5,2)  DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS cleaning_fee                  NUMERIC(10,2) DEFAULT 150.00,
  ADD COLUMN IF NOT EXISTS damage_admin_fee              NUMERIC(10,2) DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS fine_admin_fee                NUMERIC(10,2) DEFAULT 25.00,
  ADD COLUMN IF NOT EXISTS delivery_fee_per_km           NUMERIC(10,2) DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS max_discount_pct              NUMERIC(5,2)  DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS require_deposit               BOOLEAN       DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS require_customer_signature    BOOLEAN       DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS require_photos_on_checkout    BOOLEAN       DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS require_photos_on_return      BOOLEAN       DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS document_expiry_alert_days    INTEGER       DEFAULT 30,
  ADD COLUMN IF NOT EXISTS overdue_alert_hours           INTEGER       DEFAULT 2;

-- Staff profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL,
  user_id             UUID        REFERENCES users(id),
  branch_id           UUID        REFERENCES branches(id),
  full_name           VARCHAR(200) NOT NULL,
  employee_number     VARCHAR(50),
  department          VARCHAR(100),
  job_title           VARCHAR(100),
  phone_number        VARCHAR(20),
  email               VARCHAR(200),
  emirates_id         VARCHAR(50),
  emirates_id_expiry  DATE,
  driving_license     VARCHAR(50),
  license_expiry      DATE,
  visa_number         VARCHAR(50),
  visa_expiry         DATE,
  date_of_joining     DATE,
  is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, employee_number)
);

CREATE INDEX IF NOT EXISTS idx_staff_tenant    ON staff_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_staff_branch    ON staff_profiles(tenant_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_active    ON staff_profiles(tenant_id, is_active);

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE staff_profiles IS 'Staff/employee profiles with license and document tracking';
