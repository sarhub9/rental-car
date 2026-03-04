-- Migration: Create evidence tables
-- Feature: 003-rental-agreement-evidence
-- Date: 2026-02-12

-- Create ENUM types for evidence
CREATE TYPE fuel_level AS ENUM ('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL');
CREATE TYPE evidence_type AS ENUM ('CHECKOUT', 'RETURN');
CREATE TYPE photo_angle AS ENUM ('FRONT', 'BACK', 'LEFT', 'RIGHT', 'INTERIOR', 'DASHBOARD', 'DAMAGE');
CREATE TYPE charge_type AS ENUM ('EXTRA_KM', 'FUEL', 'LATE_FEE', 'DAMAGE');
CREATE TYPE approval_status AS ENUM ('AUTO_APPROVED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- Create checkout_evidence table
CREATE TABLE IF NOT EXISTS checkout_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_id UUID NOT NULL UNIQUE REFERENCES rental_agreements(id),
    odometer_reading INTEGER NOT NULL,
    fuel_level fuel_level NOT NULL,
    accessories JSONB,
    customer_signature_url TEXT,
    customer_otp_verified BOOLEAN DEFAULT FALSE,
    otp_verification_timestamp TIMESTAMPTZ,
    captured_by_user_id UUID NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_immutable BOOLEAN NOT NULL DEFAULT FALSE,

    -- Constraints
    CONSTRAINT checkout_evidence_odometer_check CHECK (odometer_reading >= 0 AND odometer_reading <= 9999999),
    CONSTRAINT checkout_evidence_signature_check CHECK (customer_signature_url IS NOT NULL OR customer_otp_verified = TRUE)
);

-- Create indexes for checkout_evidence
CREATE INDEX idx_checkout_evidence_tenant_id ON checkout_evidence(tenant_id);
CREATE INDEX idx_checkout_evidence_agreement_id ON checkout_evidence(agreement_id);

-- Create return_evidence table
CREATE TABLE IF NOT EXISTS return_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_id UUID NOT NULL UNIQUE REFERENCES rental_agreements(id),
    odometer_reading INTEGER NOT NULL,
    fuel_level fuel_level NOT NULL,
    kilometers_driven INTEGER NOT NULL,
    damage_documented BOOLEAN NOT NULL DEFAULT FALSE,
    damage_description TEXT,
    customer_acknowledgment BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledgment_timestamp TIMESTAMPTZ,
    captured_by_user_id UUID NOT NULL,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_immutable BOOLEAN NOT NULL DEFAULT TRUE,

    -- Constraints
    CONSTRAINT return_evidence_odometer_check CHECK (odometer_reading >= 0 AND odometer_reading <= 9999999),
    CONSTRAINT return_evidence_km_check CHECK (kilometers_driven >= 0),
    CONSTRAINT return_evidence_acknowledgment_check CHECK (customer_acknowledgment = TRUE)
);

-- Create indexes for return_evidence
CREATE INDEX idx_return_evidence_tenant_id ON return_evidence(tenant_id);
CREATE INDEX idx_return_evidence_agreement_id ON return_evidence(agreement_id);

-- Create photo_evidence table
CREATE TABLE IF NOT EXISTS photo_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
    evidence_type evidence_type NOT NULL,
    photo_angle photo_angle NOT NULL,
    photo_url TEXT NOT NULL,
    photo_thumbnail_url TEXT,
    file_size_bytes INTEGER NOT NULL,
    mime_type VARCHAR(50) NOT NULL,
    captured_timestamp TIMESTAMPTZ NOT NULL,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    gps_accuracy_meters DECIMAL(8,2),
    device_info JSONB,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_immutable BOOLEAN NOT NULL DEFAULT FALSE,

    -- Constraints
    CONSTRAINT photo_evidence_file_size_check CHECK (file_size_bytes > 0),
    CONSTRAINT photo_evidence_latitude_check CHECK (gps_latitude >= -90 AND gps_latitude <= 90),
    CONSTRAINT photo_evidence_longitude_check CHECK (gps_longitude >= -180 AND gps_longitude <= 180)
);

-- Create indexes for photo_evidence
CREATE INDEX idx_photo_evidence_tenant_id ON photo_evidence(tenant_id);
CREATE INDEX idx_photo_evidence_agreement_id ON photo_evidence(agreement_id);
CREATE INDEX idx_photo_evidence_type ON photo_evidence(evidence_type);

-- Create auto_generated_charges table
CREATE TABLE IF NOT EXISTS auto_generated_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
    charge_type charge_type NOT NULL,
    calculation_basis JSONB NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    rule_reference VARCHAR(100) NOT NULL,
    rule_version VARCHAR(20) NOT NULL,
    approval_status approval_status NOT NULL,
    approved_by_user_id UUID,
    approved_at TIMESTAMPTZ,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_immutable BOOLEAN NOT NULL DEFAULT TRUE,

    -- Constraints
    CONSTRAINT auto_charge_amount_check CHECK (amount >= 0),
    CONSTRAINT auto_charge_damage_approval_check CHECK (charge_type != 'DAMAGE' OR approval_status != 'AUTO_APPROVED')
);

-- Create indexes for auto_generated_charges
CREATE INDEX idx_auto_charge_tenant_id ON auto_generated_charges(tenant_id);
CREATE INDEX idx_auto_charge_agreement_id ON auto_generated_charges(agreement_id);
CREATE INDEX idx_auto_charge_type ON auto_generated_charges(charge_type);

-- Comments
COMMENT ON TABLE checkout_evidence IS 'Vehicle condition and details at rental start (checkout)';
COMMENT ON TABLE return_evidence IS 'Vehicle condition and details at rental end (return)';
COMMENT ON TABLE photo_evidence IS 'Photo metadata for checkout and return evidence';
COMMENT ON TABLE auto_generated_charges IS 'Charges automatically calculated by rule engine';
