-- Migration 019: Create companies table
-- Feature: SaaS - Company/Organization Management

CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(200) NOT NULL UNIQUE,
  phone_number VARCHAR(20),
  address TEXT,
  logo_url TEXT,
  trade_license_number VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'TRIAL'
    CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
  trial_ends_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies(contact_email);

-- Updated_at trigger
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
