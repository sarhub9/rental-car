-- Migration 006: Create invoices, invoice_line_items, and payments tables
-- Feature: Customer Portal - Invoices & Payments (Constitution: Ledger-First, Financial Control)

-- ============================================================================
-- ENUMS
-- ============================================================================
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'VOIDED', 'OVERDUE');
CREATE TYPE payment_method AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE');
CREATE TYPE payment_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- ============================================================================
-- INVOICES TABLE (Immutable once issued — Constitution: Financial Control)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  invoice_number VARCHAR(30) NOT NULL,
  agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
  customer_id UUID NOT NULL REFERENCES customers(id),

  subtotal NUMERIC(10, 2) NOT NULL,
  vat_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.0500,
  vat_amount NUMERIC(10, 2) NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance_due NUMERIC(10, 2) NOT NULL,

  status invoice_status NOT NULL DEFAULT 'DRAFT',
  issued_at TIMESTAMP WITH TIME ZONE,
  due_date DATE NOT NULL,
  voided_at TIMESTAMP WITH TIME ZONE,
  void_reason TEXT,

  notes TEXT,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_invoice_number_tenant UNIQUE (tenant_id, invoice_number),
  CONSTRAINT chk_invoice_amounts CHECK (total_amount >= 0 AND balance_due >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agreement ON invoices(agreement_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(tenant_id, status);

-- ============================================================================
-- INVOICE LINE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  line_number INTEGER NOT NULL,
  description_en VARCHAR(300) NOT NULL,
  description_ar VARCHAR(300),
  quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  charge_id UUID REFERENCES auto_generated_charges(id),
  charge_type VARCHAR(20)
);

CREATE INDEX IF NOT EXISTS idx_line_items_invoice ON invoice_line_items(invoice_id);

-- ============================================================================
-- PAYMENTS TABLE (Constitution: Ledger-First Accounting)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  payment_number VARCHAR(30) NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  customer_id UUID NOT NULL REFERENCES customers(id),

  amount NUMERIC(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'PENDING',

  transaction_reference VARCHAR(100),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,

  notes TEXT,
  received_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_payment_number_tenant UNIQUE (tenant_id, payment_number),
  CONSTRAINT chk_payment_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);

-- ============================================================================
-- IMMUTABILITY TRIGGER: Prevent amount changes on issued invoices
-- ============================================================================
CREATE OR REPLACE FUNCTION prevent_issued_invoice_updates()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IN ('ISSUED', 'PAID', 'PARTIALLY_PAID') THEN
    IF (OLD.subtotal != NEW.subtotal OR OLD.vat_amount != NEW.vat_amount
        OR OLD.total_amount != NEW.total_amount) THEN
      RAISE EXCEPTION 'Cannot modify issued invoice amounts (ID: %)', OLD.id;
    END IF;
  END IF;
  IF OLD.status = 'VOIDED' THEN
    RAISE EXCEPTION 'Cannot modify voided invoice (ID: %)', OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_invoice_amount_updates
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION prevent_issued_invoice_updates();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
