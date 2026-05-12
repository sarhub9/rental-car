-- Migration 024: Expense Module
-- Date: 2026-05-12

CREATE TYPE expense_category AS ENUM (
  'VEHICLE_MAINTENANCE','INSURANCE','REGISTRATION','FUEL','RENT',
  'SALARY','UTILITIES','MARKETING','SALIK_RECHARGE','REPAIR',
  'OFFICE','BANK_CHARGES','OTHER'
);

CREATE TABLE IF NOT EXISTS expenses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL,
  expense_number    VARCHAR(30) NOT NULL,
  category          expense_category NOT NULL,
  description       TEXT        NOT NULL,
  amount            NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  vat_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12,2) NOT NULL,
  payment_method    VARCHAR(30),
  vendor_name       VARCHAR(200),
  reference_number  VARCHAR(100),
  expense_date      DATE        NOT NULL DEFAULT CURRENT_DATE,
  vehicle_id        UUID        REFERENCES vehicles(id),
  branch_id         UUID        REFERENCES branches(id),
  receipt_url       TEXT,
  notes             TEXT,
  created_by_user_id UUID       NOT NULL REFERENCES users(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, expense_number)
);

CREATE INDEX idx_expenses_tenant    ON expenses(tenant_id);
CREATE INDEX idx_expenses_date      ON expenses(tenant_id, expense_date);
CREATE INDEX idx_expenses_category  ON expenses(tenant_id, category);
CREATE INDEX idx_expenses_vehicle   ON expenses(vehicle_id);

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE expenses IS 'Business expense tracking with category, vendor, and vehicle linkage';
