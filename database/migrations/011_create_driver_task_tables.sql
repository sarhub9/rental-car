-- Migration 011: Driver/Recovery Task Tables
-- Feature: 005-driver-recovery
-- Date: 2026-02-15

-- ============================================================================
-- ENUM Types
-- ============================================================================

CREATE TYPE task_type AS ENUM ('DELIVERY', 'PICKUP', 'RECOVERY');
CREATE TYPE task_status AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE task_priority AS ENUM ('NORMAL', 'URGENT', 'CRITICAL');
CREATE TYPE damage_severity AS ENUM ('MINOR', 'MODERATE', 'MAJOR');
CREATE TYPE recovery_attempt_type AS ENUM ('PHONE_CALL', 'SMS', 'VISIT');
CREATE TYPE recovery_attempt_outcome AS ENUM (
  'NO_ANSWER', 'CUSTOMER_COOPERATIVE', 'CUSTOMER_UNCOOPERATIVE',
  'VEHICLE_FOUND', 'VEHICLE_NOT_FOUND'
);

-- ============================================================================
-- Table: vehicle_tasks
-- Primary task table for delivery, pickup, and recovery operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    agreement_id UUID NOT NULL REFERENCES rental_agreements(id),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    assigned_driver_id UUID NOT NULL REFERENCES users(id),
    task_type task_type NOT NULL,
    status task_status NOT NULL DEFAULT 'ASSIGNED',
    priority task_priority NOT NULL DEFAULT 'NORMAL',
    destination_address TEXT NOT NULL,
    destination_latitude DECIMAL(10,8),
    destination_longitude DECIMAL(11,8),
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    odometer_reading INTEGER,
    fuel_level fuel_level,
    condition_notes TEXT,
    admin_notes TEXT,
    customer_confirmation_type VARCHAR(20),
    customer_confirmation_at TIMESTAMPTZ,
    signature_url TEXT,
    is_immutable BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT vehicle_tasks_odometer_check CHECK (odometer_reading IS NULL OR (odometer_reading >= 0 AND odometer_reading <= 9999999)),
    CONSTRAINT vehicle_tasks_unique_type_per_agreement UNIQUE (tenant_id, agreement_id, task_type)
);

COMMENT ON TABLE vehicle_tasks IS 'Driver delivery, pickup, and recovery task assignments';

-- Indexes
CREATE INDEX idx_vehicle_tasks_tenant_id ON vehicle_tasks(tenant_id);
CREATE INDEX idx_vehicle_tasks_driver_date ON vehicle_tasks(tenant_id, assigned_driver_id, scheduled_at);
CREATE INDEX idx_vehicle_tasks_agreement ON vehicle_tasks(tenant_id, agreement_id);
CREATE INDEX idx_vehicle_tasks_status ON vehicle_tasks(tenant_id, status);
CREATE INDEX idx_vehicle_tasks_vehicle ON vehicle_tasks(tenant_id, vehicle_id);

-- ============================================================================
-- Table: task_evidence_photos
-- Photos captured during task execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_evidence_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    task_id UUID NOT NULL REFERENCES vehicle_tasks(id),
    photo_angle photo_angle NOT NULL,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    gps_accuracy_meters DECIMAL(8,2),
    captured_at TIMESTAMPTZ NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    captured_by_user_id UUID NOT NULL
);

COMMENT ON TABLE task_evidence_photos IS 'Evidence photos captured during driver tasks';

CREATE INDEX idx_task_evidence_photos_task ON task_evidence_photos(tenant_id, task_id);

-- ============================================================================
-- Table: task_damage_records
-- Damage documentation during pickup or recovery
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_damage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    task_id UUID NOT NULL REFERENCES vehicle_tasks(id),
    description TEXT NOT NULL,
    severity damage_severity NOT NULL,
    vehicle_area VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE task_damage_records IS 'Vehicle damage records documented during pickup or recovery';

CREATE INDEX idx_task_damage_records_task ON task_damage_records(tenant_id, task_id);

-- ============================================================================
-- Table: task_damage_photos
-- Photos specific to a damage record
-- ============================================================================

CREATE TABLE IF NOT EXISTS task_damage_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    damage_record_id UUID NOT NULL REFERENCES task_damage_records(id),
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    captured_at TIMESTAMPTZ NOT NULL
);

COMMENT ON TABLE task_damage_photos IS 'Photos documenting specific vehicle damage';

CREATE INDEX idx_task_damage_photos_damage ON task_damage_photos(tenant_id, damage_record_id);

-- ============================================================================
-- Table: location_updates
-- GPS tracking points during active tasks
-- ============================================================================

CREATE TABLE IF NOT EXISTS location_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    task_id UUID NOT NULL REFERENCES vehicle_tasks(id),
    driver_id UUID NOT NULL REFERENCES users(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy_meters DECIMAL(8,2),
    speed_kmh DECIMAL(6,2),
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE location_updates IS 'GPS location tracking points during active driver tasks';

CREATE INDEX idx_location_updates_task ON location_updates(tenant_id, task_id, recorded_at);
CREATE INDEX idx_location_updates_driver ON location_updates(tenant_id, driver_id, recorded_at);

-- ============================================================================
-- Table: recovery_attempts
-- Log entries for recovery contact/visit attempts
-- ============================================================================

CREATE TABLE IF NOT EXISTS recovery_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    task_id UUID NOT NULL REFERENCES vehicle_tasks(id),
    attempt_type recovery_attempt_type NOT NULL,
    outcome recovery_attempt_outcome NOT NULL,
    notes TEXT,
    attempted_by UUID NOT NULL REFERENCES users(id),
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE recovery_attempts IS 'Recovery attempt logs for overdue/defaulting vehicle retrieval';

CREATE INDEX idx_recovery_attempts_task ON recovery_attempts(tenant_id, task_id);

-- ============================================================================
-- Immutability trigger for vehicle_tasks
-- Prevents updates to completed tasks (same pattern as rental_agreements)
-- ============================================================================

CREATE OR REPLACE FUNCTION raise_vehicle_task_immutable_error()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Cannot modify immutable vehicle task. Completed tasks cannot be edited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_vehicle_task_immutable_updates
    BEFORE UPDATE ON vehicle_tasks
    FOR EACH ROW
    WHEN (OLD.is_immutable = TRUE)
    EXECUTE FUNCTION raise_vehicle_task_immutable_error();

-- ============================================================================
-- Updated_at trigger for vehicle_tasks
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vehicle_task_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_vehicle_task_updated_at
    BEFORE UPDATE ON vehicle_tasks
    FOR EACH ROW
    WHEN (OLD.is_immutable = FALSE)
    EXECUTE FUNCTION update_vehicle_task_timestamp();

-- ============================================================================
-- ALTER existing tables
-- Add delivery tracking columns to rental_agreements
-- ============================================================================

ALTER TABLE rental_agreements
    ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS delivery_task_id UUID REFERENCES vehicle_tasks(id);
