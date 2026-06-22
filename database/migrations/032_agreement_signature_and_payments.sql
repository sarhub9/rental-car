-- Migration 032: Agreement customer signature + direct agreement payments
-- - Capture a customer signature on the agreement after creation.
-- - Allow recording payments against an agreement before an invoice exists.

-- Customer signature on the agreement
ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS customer_signature_url TEXT;

-- Payments: allow linking to an agreement directly (invoice optional)
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS agreement_id UUID REFERENCES rental_agreements(id);

ALTER TABLE payments
  ALTER COLUMN invoice_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_agreement ON payments(agreement_id);
