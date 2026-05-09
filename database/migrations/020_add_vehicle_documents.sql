-- Migration 020: Add Vehicle Documents
-- Feature: Document uploads with expiry alerts
-- Date: 2026-02-27

CREATE TYPE vehicle_document_type AS ENUM ('REGISTRATION','INSURANCE','MULKIYA','PERMIT','INSPECTION_CERT','OTHER');

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  document_type vehicle_document_type NOT NULL,
  document_number VARCHAR(100),
  issued_date DATE,
  expiry_date DATE,
  document_url TEXT,
  thumbnail_url TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_vehicle_doc_dates CHECK (issued_date IS NULL OR expiry_date IS NULL OR expiry_date > issued_date)
);

CREATE INDEX idx_vehicle_docs_tenant_vehicle ON vehicle_documents(tenant_id, vehicle_id);
CREATE INDEX idx_vehicle_docs_type ON vehicle_documents(tenant_id, document_type);
CREATE INDEX idx_vehicle_docs_expiry ON vehicle_documents(tenant_id, expiry_date, is_active);

CREATE TRIGGER trg_vehicle_docs_updated_at
  BEFORE UPDATE ON vehicle_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE vehicle_documents IS 'Vehicle compliance documents (registration, insurance, mulkiya) with expiry tracking';
