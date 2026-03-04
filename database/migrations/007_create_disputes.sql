-- Migration 007: Create disputes and dispute_messages tables
-- Feature: Customer Portal - Dispute Workflow

CREATE TYPE dispute_status AS ENUM ('OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED');

-- ============================================================================
-- DISPUTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  dispute_number VARCHAR(30) NOT NULL,
  agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  charge_id UUID REFERENCES auto_generated_charges(id),
  invoice_id UUID REFERENCES invoices(id),

  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  status dispute_status NOT NULL DEFAULT 'OPEN',

  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  resolved_by_user_id UUID,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_dispute_number_tenant UNIQUE (tenant_id, dispute_number)
);

CREATE INDEX IF NOT EXISTS idx_disputes_tenant ON disputes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_agreement ON disputes(agreement_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(tenant_id, status);

-- ============================================================================
-- DISPUTE MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id),
  sender_user_id UUID NOT NULL,
  sender_role VARCHAR(30) NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE TRIGGER trg_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
