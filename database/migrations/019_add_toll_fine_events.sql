-- Migration 019: Add Toll / Fine Events
-- Feature: Attribution engine by plate + datetime
-- Date: 2026-02-27

CREATE TYPE toll_event_type AS ENUM ('TOLL','SALIK','PARKING_FINE','TRAFFIC_FINE','OTHER');
CREATE TYPE attribution_status AS ENUM ('UNATTRIBUTED','ATTRIBUTED','CONFLICT','UNRESOLVABLE','WAIVED');
CREATE TYPE attribution_method AS ENUM ('AUTO','MANUAL');

CREATE TABLE IF NOT EXISTS fine_toll_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  event_number VARCHAR(30) NOT NULL,
  plate_number VARCHAR(20) NOT NULL,
  plate_emirate VARCHAR(50),
  event_type toll_event_type NOT NULL,
  event_datetime TIMESTAMPTZ NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  admin_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  location TEXT,
  description TEXT,
  source_reference VARCHAR(100),
  attribution_status attribution_status NOT NULL DEFAULT 'UNATTRIBUTED',
  attributed_agreement_id UUID REFERENCES rental_agreements(id),
  attributed_customer_id UUID REFERENCES customers(id),
  attribution_method attribution_method,
  attributed_at TIMESTAMPTZ,
  attributed_by_user_id UUID REFERENCES users(id),
  conflict_notes TEXT,
  invoice_id UUID REFERENCES invoices(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, event_number),
  CONSTRAINT chk_toll_amount CHECK (amount > 0),
  CONSTRAINT chk_toll_admin_fee CHECK (admin_fee >= 0),
  CONSTRAINT chk_toll_total CHECK (total_amount = amount + admin_fee)
);

CREATE INDEX idx_toll_events_tenant ON fine_toll_events(tenant_id);
CREATE INDEX idx_toll_events_plate ON fine_toll_events(tenant_id, plate_number);
CREATE INDEX idx_toll_events_datetime ON fine_toll_events(tenant_id, event_datetime);
CREATE INDEX idx_toll_events_status ON fine_toll_events(tenant_id, attribution_status);
CREATE INDEX idx_toll_events_agreement ON fine_toll_events(attributed_agreement_id);

CREATE TRIGGER trg_toll_events_updated_at
  BEFORE UPDATE ON fine_toll_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE fine_toll_events IS 'Toll charges and traffic fines with auto-attribution by plate + datetime overlap';
COMMENT ON COLUMN fine_toll_events.conflict_notes IS 'Populated when multiple agreements match the event datetime — requires manual resolution';
