-- Migration 036: Officer signature + vehicle inspection (checklist + photos)
-- on rental agreements. The inspection JSON holds the before (checkout) and
-- after (return) part-condition checklist, photos and notes, all editable
-- directly on the agreement and rendered on the printed contract.

ALTER TABLE rental_agreements
  ADD COLUMN IF NOT EXISTS officer_signature_url TEXT,
  ADD COLUMN IF NOT EXISTS inspection JSONB;

COMMENT ON COLUMN rental_agreements.officer_signature_url IS 'Authorized officer / company representative signature';
COMMENT ON COLUMN rental_agreements.inspection IS 'Vehicle inspection: { before: { parts, photos, notes }, after: { parts, photos, notes } }';
