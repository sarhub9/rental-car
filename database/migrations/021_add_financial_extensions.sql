-- Migration 021: Financial Extensions
-- Feature: Cash Drawer Sessions, Refund Requests, split payments, tenant rule thresholds
-- Date: 2026-02-27

-- ============================================================================
-- Cash Drawer Sessions
-- ============================================================================
CREATE TYPE drawer_status AS ENUM ('OPEN','CLOSED');

CREATE TABLE IF NOT EXISTS cash_drawer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  branch_id UUID REFERENCES branches(id),
  session_date DATE NOT NULL,
  opened_by_user_id UUID NOT NULL REFERENCES users(id),
  closed_by_user_id UUID REFERENCES users(id),
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(12,2),
  expected_closing NUMERIC(12,2),
  status drawer_status NOT NULL DEFAULT 'OPEN',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_drawer_balance CHECK (opening_balance >= 0)
);

CREATE INDEX idx_cash_drawer_tenant ON cash_drawer_sessions(tenant_id);
CREATE INDEX idx_cash_drawer_date ON cash_drawer_sessions(tenant_id, session_date);
CREATE INDEX idx_cash_drawer_status ON cash_drawer_sessions(tenant_id, status);

-- ============================================================================
-- Refund Requests
-- ============================================================================
CREATE TYPE refund_status AS ENUM ('PENDING','APPROVED','REJECTED','PROCESSED');

CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  refund_number VARCHAR(30) NOT NULL,
  payment_id UUID NOT NULL REFERENCES payments(id),
  invoice_id UUID REFERENCES invoices(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  requested_by_user_id UUID NOT NULL REFERENCES users(id),
  amount NUMERIC(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status refund_status NOT NULL DEFAULT 'PENDING',
  approved_by_user_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  processed_at TIMESTAMPTZ,
  refund_method payment_method,
  transaction_reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, refund_number),
  CONSTRAINT chk_refund_amount CHECK (amount > 0)
);

CREATE INDEX idx_refund_requests_tenant ON refund_requests(tenant_id);
CREATE INDEX idx_refund_requests_status ON refund_requests(tenant_id, status);
CREATE INDEX idx_refund_requests_payment ON refund_requests(payment_id);
CREATE INDEX idx_refund_requests_customer ON refund_requests(tenant_id, customer_id);

CREATE TRIGGER trg_refund_requests_updated_at
  BEFORE UPDATE ON refund_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Extend payments table
-- ============================================================================
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS drawer_session_id UUID REFERENCES cash_drawer_sessions(id),
  ADD COLUMN IF NOT EXISTS is_deposit_payment BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS split_group_id UUID;

CREATE INDEX IF NOT EXISTS idx_payments_drawer ON payments(drawer_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_split_group ON payments(split_group_id);

-- ============================================================================
-- Extend tenant_rules table
-- ============================================================================
ALTER TABLE tenant_rules
  ADD COLUMN IF NOT EXISTS discount_approval_threshold_pct NUMERIC(5,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS refund_approval_threshold NUMERIC(10,2) DEFAULT 500.00,
  ADD COLUMN IF NOT EXISTS deposit_default_pct NUMERIC(5,2) DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS admin_fee_per_toll NUMERIC(10,2) DEFAULT 25.00;

COMMENT ON TABLE cash_drawer_sessions IS 'Daily cash drawer open/close sessions per branch';
COMMENT ON TABLE refund_requests IS 'Refund request workflow with approval threshold enforcement';
COMMENT ON COLUMN payments.split_group_id IS 'Groups multiple payments covering the same invoice (split payment)';
