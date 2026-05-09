-- Migration 018: Add Maintenance / Work Orders
-- Feature: Vehicle maintenance workflow + auto schedules
-- Date: 2026-02-27

CREATE TYPE work_order_status AS ENUM ('OPEN','ASSIGNED','IN_PROGRESS','WAITING_PARTS','COMPLETE','CANCELLED');
CREATE TYPE maintenance_type AS ENUM ('OIL_CHANGE','TIRE_ROTATION','BRAKE_SERVICE','AC_SERVICE','MAJOR_SERVICE','INSPECTION','BODY_REPAIR','OTHER');
CREATE TYPE wo_item_type AS ENUM ('PARTS','LABOR','SUBLET');

-- Maintenance schedule (triggers work orders at intervals)
CREATE TABLE IF NOT EXISTS vehicle_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  maintenance_type maintenance_type NOT NULL,
  interval_km INTEGER,
  interval_days INTEGER,
  last_done_odometer INTEGER,
  last_done_at DATE,
  next_due_odometer INTEGER,
  next_due_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_vms_interval CHECK (interval_km IS NOT NULL OR interval_days IS NOT NULL)
);

CREATE INDEX idx_vms_tenant_vehicle ON vehicle_maintenance_schedules(tenant_id, vehicle_id);
CREATE INDEX idx_vms_due ON vehicle_maintenance_schedules(tenant_id, next_due_at, is_active);

CREATE TRIGGER trg_vms_updated_at
  BEFORE UPDATE ON vehicle_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Work orders
CREATE TABLE IF NOT EXISTS work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  work_order_number VARCHAR(30) NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  maintenance_type maintenance_type NOT NULL,
  status work_order_status NOT NULL DEFAULT 'OPEN',
  priority task_priority NOT NULL DEFAULT 'NORMAL',
  description TEXT NOT NULL,
  vendor_name VARCHAR(200),
  vendor_contact VARCHAR(100),
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  odometer_in INTEGER,
  odometer_out INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  blocks_rental BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  assigned_to_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, work_order_number),
  CONSTRAINT chk_wo_odometer CHECK (odometer_in IS NULL OR odometer_out IS NULL OR odometer_out >= odometer_in)
);

CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX idx_work_orders_vehicle ON work_orders(tenant_id, vehicle_id);
CREATE INDEX idx_work_orders_status ON work_orders(tenant_id, status);
CREATE INDEX idx_work_orders_blocks ON work_orders(tenant_id, vehicle_id, blocks_rental, status);

CREATE TRIGGER trg_work_orders_updated_at
  BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Work order line items (parts, labor, sublet)
CREATE TABLE IF NOT EXISTS work_order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  item_type wo_item_type NOT NULL,
  description VARCHAR(300) NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10,2) NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  CONSTRAINT chk_woli_quantity CHECK (quantity > 0),
  CONSTRAINT chk_woli_price CHECK (unit_price >= 0)
);

CREATE INDEX idx_woli_work_order ON work_order_line_items(work_order_id);

COMMENT ON TABLE work_orders IS 'Vehicle maintenance work orders with cost tracking and rental blocking';
COMMENT ON TABLE vehicle_maintenance_schedules IS 'Auto-maintenance scheduling by KM interval or days';
COMMENT ON COLUMN work_orders.blocks_rental IS 'If TRUE and status != COMPLETE/CANCELLED, vehicle cannot be rented';
