-- Migration 022: Add Incidents / Insurance Claims
-- Feature: Incident tracking with photos + claim management
-- Date: 2026-02-27

CREATE TYPE incident_type AS ENUM ('ACCIDENT','THEFT','VANDALISM','FIRE','FLOOD','OTHER');
CREATE TYPE incident_status AS ENUM ('OPEN','UNDER_REVIEW','CLAIMED','SETTLED','CLOSED','REJECTED');

CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  incident_number VARCHAR(30) NOT NULL,
  agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  incident_type incident_type NOT NULL,
  incident_datetime TIMESTAMPTZ NOT NULL,
  location TEXT,
  description TEXT NOT NULL,
  police_report_number VARCHAR(100),
  status incident_status NOT NULL DEFAULT 'OPEN',
  estimated_repair_cost NUMERIC(10,2),
  actual_repair_cost NUMERIC(10,2),
  insurance_claim_number VARCHAR(100),
  claim_amount NUMERIC(10,2),
  settlement_amount NUMERIC(10,2),
  settled_at TIMESTAMPTZ,
  assigned_to_user_id UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, incident_number)
);

CREATE INDEX idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX idx_incidents_agreement ON incidents(tenant_id, agreement_id);
CREATE INDEX idx_incidents_vehicle ON incidents(tenant_id, vehicle_id);
CREATE INDEX idx_incidents_status ON incidents(tenant_id, status);
CREATE INDEX idx_incidents_customer ON incidents(tenant_id, customer_id);

CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description VARCHAR(300),
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incident_photos_incident ON incident_photos(tenant_id, incident_id);

COMMENT ON TABLE incidents IS 'Vehicle incident tracking (accidents, theft) with insurance claim management';
COMMENT ON TABLE incident_photos IS 'Photo evidence attached to incident reports';
