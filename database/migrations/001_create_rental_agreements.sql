-- Migration: Create rental_agreements table
-- Feature: 003-rental-agreement-evidence
-- Date: 2026-02-12

-- Create ENUM types
CREATE TYPE agreement_status AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- Create rental_agreements table
CREATE TABLE IF NOT EXISTS rental_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    rental_start_datetime TIMESTAMPTZ NOT NULL,
    rental_end_datetime TIMESTAMPTZ NOT NULL,
    daily_rate DECIMAL(10,2),
    weekly_rate DECIMAL(10,2),
    estimated_amount DECIMAL(10,2) NOT NULL,
    actual_amount DECIMAL(10,2),
    status agreement_status NOT NULL DEFAULT 'DRAFT',
    checkout_timestamp TIMESTAMPTZ,
    return_timestamp TIMESTAMPTZ,
    created_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_immutable BOOLEAN NOT NULL DEFAULT FALSE,

    -- Constraints
    CONSTRAINT rental_agreements_date_check CHECK (rental_end_datetime > rental_start_datetime),
    CONSTRAINT rental_agreements_amount_check CHECK (estimated_amount >= 0),
    CONSTRAINT rental_agreements_rate_check CHECK (daily_rate > 0 OR weekly_rate > 0),
    CONSTRAINT rental_agreements_unique_number UNIQUE (tenant_id, agreement_number)
);

-- Create indexes
CREATE INDEX idx_rental_agreement_tenant_id ON rental_agreements(tenant_id);
CREATE INDEX idx_rental_agreement_status ON rental_agreements(status);
CREATE INDEX idx_rental_agreement_customer_id ON rental_agreements(customer_id);
CREATE INDEX idx_rental_agreement_vehicle_id ON rental_agreements(vehicle_id);
CREATE INDEX idx_rental_agreement_number ON rental_agreements(agreement_number);

-- Create agreement_audit_log table
CREATE TABLE IF NOT EXISTS agreement_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
    event_type VARCHAR(50) NOT NULL,
    event_description TEXT NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    user_id UUID NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_data JSONB
);

-- Create indexes for audit log
CREATE INDEX idx_audit_log_tenant_id ON agreement_audit_log(tenant_id);
CREATE INDEX idx_audit_log_agreement_id ON agreement_audit_log(agreement_id);
CREATE INDEX idx_audit_log_timestamp ON agreement_audit_log(event_timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at (idempotent)
DO $$ BEGIN
  CREATE TRIGGER update_rental_agreements_updated_at
      BEFORE UPDATE ON rental_agreements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Comments
COMMENT ON TABLE rental_agreements IS 'Rental agreement lifecycle management (Draft → Active → Closed)';
COMMENT ON TABLE agreement_audit_log IS 'Audit trail for all agreement lifecycle events';
COMMENT ON COLUMN rental_agreements.is_immutable IS 'Set to TRUE when agreement is activated, prevents further modifications';
