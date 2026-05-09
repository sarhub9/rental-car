-- Migration 014: Add Corporate Accounts
-- Feature: Full CorporateAccount entity + A/R aging
-- Date: 2026-02-27

CREATE TABLE IF NOT EXISTS corporate_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  account_number VARCHAR(30) NOT NULL,
  company_name VARCHAR(300) NOT NULL,
  company_name_ar VARCHAR(300),
  trade_license_number VARCHAR(100),
  vat_number VARCHAR(50),
  credit_limit NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_terms_days INTEGER NOT NULL DEFAULT 30,
  credit_used NUMERIC(12,2) NOT NULL DEFAULT 0,
  contact_person VARCHAR(200),
  phone VARCHAR(20),
  email VARCHAR(200),
  billing_address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, account_number),
  CONSTRAINT chk_corp_credit_limit CHECK (credit_limit >= 0),
  CONSTRAINT chk_corp_credit_used CHECK (credit_used >= 0),
  CONSTRAINT chk_corp_payment_terms CHECK (payment_terms_days > 0)
);

CREATE INDEX idx_corporate_accounts_tenant ON corporate_accounts(tenant_id);
CREATE INDEX idx_corporate_accounts_active ON corporate_accounts(tenant_id, is_active);

CREATE TRIGGER trg_corporate_accounts_updated_at
  BEFORE UPDATE ON corporate_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Link customers to corporate accounts
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS corporate_account_id UUID REFERENCES corporate_accounts(id);

CREATE INDEX idx_customers_corporate ON customers(corporate_account_id);

COMMENT ON TABLE corporate_accounts IS 'Corporate client accounts with credit limits and billing terms';
