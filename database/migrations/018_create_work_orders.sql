-- Migration 018: Create work_orders table
-- Feature: 006-erp-core-upgrade (US6: Maintenance Module)
-- Constitution: XI. Availability & Booking Integrity — vehicles blocked when maintenance overdue

DO $$ BEGIN
  CREATE TYPE work_order_type AS ENUM ('scheduled', 'unscheduled', 'recall', 'inspection');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE work_order_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  work_order_number VARCHAR(30) NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  type work_order_type NOT NULL DEFAULT 'scheduled',
  description TEXT NOT NULL,
  estimated_cost DECIMAL(10,2),
  actual_cost DECIMAL(10,2),
  scheduled_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status work_order_status NOT NULL DEFAULT 'open',
  downtime_days INTEGER NOT NULL DEFAULT 0,
  next_maintenance_km INTEGER,
  next_maintenance_date DATE,
  notes TEXT,
  created_by_user_id UUID NOT NULL,
  completed_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_work_order_number UNIQUE (tenant_id, work_order_number),
  CONSTRAINT chk_wo_est_cost CHECK (estimated_cost IS NULL OR estimated_cost >= 0),
  CONSTRAINT chk_wo_actual_cost CHECK (actual_cost IS NULL OR actual_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_wo_tenant ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_wo_vehicle ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_wo_scheduled ON work_orders(tenant_id, scheduled_date);

DO $$ BEGIN
  CREATE TRIGGER trg_wo_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMENT ON TABLE work_orders IS 'Vehicle maintenance work orders with cost/downtime tracking and vehicle blocking';
