-- Migration 004: Create customers, vehicle_categories, vehicles, and tenant_rules tables
-- Feature: Front Desk - Customer & Vehicle Management

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  customer_number VARCHAR(20) NOT NULL,
  full_name_en VARCHAR(200) NOT NULL,
  full_name_ar VARCHAR(200),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  emirates_id VARCHAR(20),
  driving_license_number VARCHAR(50) NOT NULL,
  license_expiry_date DATE NOT NULL,
  customer_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL'
    CHECK (customer_type IN ('INDIVIDUAL', 'CORPORATE')),
  address_line_1 VARCHAR(300),
  address_line_2 VARCHAR(300),
  city VARCHAR(100),
  emirate VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_customer_number_tenant UNIQUE (tenant_id, customer_number),
  CONSTRAINT uq_phone_tenant UNIQUE (tenant_id, phone_number),
  CONSTRAINT uq_license_tenant UNIQUE (tenant_id, driving_license_number)
);

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(tenant_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_license ON customers(tenant_id, driving_license_number);
CREATE INDEX IF NOT EXISTS idx_customers_name_en ON customers(tenant_id, full_name_en);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(tenant_id, is_active);

-- ============================================================================
-- VEHICLE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  category_code VARCHAR(20) NOT NULL,
  daily_rate_default NUMERIC(10, 2),
  weekly_rate_default NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_category_code_tenant UNIQUE (tenant_id, category_code)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_categories_tenant ON vehicle_categories(tenant_id);

-- ============================================================================
-- VEHICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  vehicle_number VARCHAR(20) NOT NULL,
  category_id UUID REFERENCES vehicle_categories(id),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990 AND year <= 2100),
  color VARCHAR(50),
  plate_number VARCHAR(20) NOT NULL,
  plate_emirate VARCHAR(50) NOT NULL,
  chassis_number VARCHAR(50),
  transmission_type VARCHAR(20) DEFAULT 'AUTOMATIC'
    CHECK (transmission_type IN ('AUTOMATIC', 'MANUAL')),
  fuel_type VARCHAR(20) DEFAULT 'PETROL'
    CHECK (fuel_type IN ('PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC')),
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE')),
  daily_rate NUMERIC(10, 2),
  weekly_rate NUMERIC(10, 2),
  current_odometer INTEGER DEFAULT 0,
  registration_expiry DATE,
  insurance_expiry DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_vehicle_number_tenant UNIQUE (tenant_id, vehicle_number),
  CONSTRAINT uq_plate_tenant UNIQUE (tenant_id, plate_number, plate_emirate)
);

-- Vehicle indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON vehicles(tenant_id, plate_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(tenant_id, category_id);

-- ============================================================================
-- TENANT RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  km_allowance_per_day INTEGER NOT NULL DEFAULT 200,
  rate_per_extra_km NUMERIC(10, 2) NOT NULL DEFAULT 0.50,
  fuel_refill_rate NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
  late_fee_per_hour NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  grace_period_minutes INTEGER NOT NULL DEFAULT 30,
  rule_version VARCHAR(10) NOT NULL DEFAULT 'V1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_tenant_rules UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_rules_tenant ON tenant_rules(tenant_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vehicle_categories_updated_at
  BEFORE UPDATE ON vehicle_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tenant_rules_updated_at
  BEFORE UPDATE ON tenant_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
