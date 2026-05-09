-- Migration 017: Add Deposits
-- Feature: Deposit lifecycle HELD→USED→RELEASED→FORFEITED
-- Date: 2026-02-27

CREATE TYPE deposit_status AS ENUM ('HELD','PARTIALLY_USED','USED','RELEASED','FORFEITED');

CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  deposit_number VARCHAR(30) NOT NULL,
  agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount NUMERIC(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  transaction_reference VARCHAR(100),
  status deposit_status NOT NULL DEFAULT 'HELD',
  held_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  release_notes TEXT,
  release_approved_by UUID REFERENCES users(id),
  forfeited_at TIMESTAMPTZ,
  forfeiture_reason TEXT,
  amount_used NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_released NUMERIC(10,2) NOT NULL DEFAULT 0,
  received_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, deposit_number),
  CONSTRAINT chk_deposit_amount CHECK (amount > 0),
  CONSTRAINT chk_deposit_amount_used CHECK (amount_used >= 0),
  CONSTRAINT chk_deposit_amount_released CHECK (amount_released >= 0),
  CONSTRAINT chk_deposit_totals CHECK (amount_used + amount_released <= amount)
);

CREATE INDEX idx_deposits_tenant ON deposits(tenant_id);
CREATE INDEX idx_deposits_agreement ON deposits(tenant_id, agreement_id);
CREATE INDEX idx_deposits_customer ON deposits(tenant_id, customer_id);
CREATE INDEX idx_deposits_status ON deposits(tenant_id, status);

CREATE TRIGGER trg_deposits_updated_at
  BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE deposits IS 'Security deposit lifecycle management: HELD → PARTIALLY_USED/USED → RELEASED/FORFEITED';
