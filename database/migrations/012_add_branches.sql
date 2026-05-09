-- Migration 012: Add Branches
-- Feature: Branch-level data separation
-- Date: 2026-02-27

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  branch_name VARCHAR(200) NOT NULL,
  branch_code VARCHAR(20) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(200),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_main_branch BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, branch_code)
);

CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_branches_active ON branches(tenant_id, is_active);

CREATE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add branch_id to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Add branch_id to vehicles
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- Add branch_id to rental_agreements
ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

COMMENT ON TABLE branches IS 'Branch offices within a tenant for location-level data isolation';
