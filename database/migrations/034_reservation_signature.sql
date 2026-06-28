-- Migration 034: Customer signature on reservations
-- Capture the customer's signature at the reservation stage so it can be
-- carried into the rental agreement on conversion.

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS customer_signature_url TEXT;

COMMENT ON COLUMN reservations.customer_signature_url IS 'Customer signature captured on the reservation; copied to the agreement on conversion';
