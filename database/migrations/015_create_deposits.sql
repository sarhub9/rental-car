-- Migration 015: Create deposits table
-- Feature: 006-erp-core-upgrade (US4: Deposit Lifecycle)
-- Constitution: V. Financial Control — deposits are liabilities until settled

DO $$ BEGIN
  CREATE TYPE deposit_status AS ENUM ('HELD', 'USED', 'RELEASED', 'FORFEITED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount DECIMAL(10,2) NOT NULL,
  status deposit_status NOT NULL DEFAULT 'HELD',
  amount_used DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_released DECIMAL(10,2) NOT NULL DEFAULT 0,
  collected_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  policy_delay_days INTEGER NOT NULL DEFAULT 7,
  release_eligible_at TIMESTAMPTZ,
  forfeited_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  payment_method VARCHAR(20),
  notes TEXT,
  processed_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_deposit_amount CHECK (amount > 0),
  CONSTRAINT chk_deposit_used CHECK (amount_used >= 0 AND amount_used <= amount),
  CONSTRAINT chk_deposit_released CHECK (amount_released >= 0 AND amount_released <= amount)
);

CREATE INDEX IF NOT EXISTS idx_deposits_tenant ON deposits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposits_agreement ON deposits(agreement_id);
CREATE INDEX IF NOT EXISTS idx_deposits_customer ON deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_deposits_release_eligible ON deposits(tenant_id, status, release_eligible_at);

DO $$ BEGIN
  CREATE TRIGGER trg_deposits_updated_at
    BEFORE UPDATE ON deposits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMENT ON TABLE deposits IS 'Deposit lifecycle: HELD → USED | RELEASED | FORFEITED → REFUNDED. Liabilities until settled.';
