-- Migration 017: Create toll_fine_events table
-- Feature: 006-erp-core-upgrade (US5: Toll/Fine Attribution)
-- Constitution: XII. Automation Engine — auto-attribute tolls/fines to agreements

DO $$ BEGIN
  CREATE TYPE toll_fine_type AS ENUM ('salik', 'traffic_fine', 'parking_fine');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE toll_attribution_status AS ENUM ('pending', 'matched', 'unmatched', 'manual');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS toll_fine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plate_number VARCHAR(20) NOT NULL,
  event_type toll_fine_type NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  location VARCHAR(200),
  source_reference VARCHAR(100),
  attribution_status toll_attribution_status NOT NULL DEFAULT 'pending',
  agreement_id UUID REFERENCES rental_agreements(id),
  charge_id UUID REFERENCES auto_generated_charges(id),
  matched_at TIMESTAMPTZ,
  matched_by_user_id UUID,
  import_batch_id VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_toll_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_tfe_tenant ON toll_fine_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tfe_plate ON toll_fine_events(tenant_id, plate_number);
CREATE INDEX IF NOT EXISTS idx_tfe_timestamp ON toll_fine_events(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_tfe_status ON toll_fine_events(tenant_id, attribution_status);
CREATE INDEX IF NOT EXISTS idx_tfe_agreement ON toll_fine_events(agreement_id);
CREATE INDEX IF NOT EXISTS idx_tfe_batch ON toll_fine_events(import_batch_id);

DO $$ BEGIN
  CREATE TRIGGER trg_tfe_updated_at
    BEFORE UPDATE ON toll_fine_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMENT ON TABLE toll_fine_events IS 'Salik tolls and traffic fines, auto-attributed to rental agreements by plate + date matching';
