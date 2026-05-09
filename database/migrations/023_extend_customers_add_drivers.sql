-- Migration 023: Extend customers for 4 customer types + create driver_profiles table

-- ============================================================================
-- EXTEND CUSTOMERS TABLE
-- ============================================================================

-- Update customer_type constraint to support all 4 types
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_type_check;
ALTER TABLE customers ADD CONSTRAINT customers_customer_type_check
  CHECK (customer_type IN ('INDIVIDUAL', 'UAE_RESIDENT', 'TOURIST', 'COMPANY', 'CORPORATE'));

-- Type-specific fields
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS nationality VARCHAR(100),
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS id_expiry_date DATE,
  ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS passport_expiry DATE,
  ADD COLUMN IF NOT EXISTS visa_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS visa_expiry DATE,
  ADD COLUMN IF NOT EXISTS hotel_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS hotel_address VARCHAR(300),
  ADD COLUMN IF NOT EXISTS arrival_date DATE,
  ADD COLUMN IF NOT EXISTS departure_date DATE,
  ADD COLUMN IF NOT EXISTS trade_license_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS trade_license_expiry DATE,
  ADD COLUMN IF NOT EXISTS trn_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS company_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS authorized_person_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS authorized_person_mobile VARCHAR(20),
  ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50),
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS corporate_account_id UUID,
  ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (verification_status IN ('PENDING', 'VERIFIED', 'BLOCKED')),
  ADD COLUMN IF NOT EXISTS blacklist_reason TEXT,
  ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(12, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(tenant_id, customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_verification ON customers(tenant_id, verification_status);

-- ============================================================================
-- DRIVER PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  driver_number VARCHAR(20) NOT NULL,
  driver_type VARCHAR(30) NOT NULL
    CHECK (driver_type IN ('MAIN_CUSTOMER', 'ADDITIONAL', 'COMPANY', 'CORPORATE', 'STAFF_DELIVERY', 'STAFF_COLLECTION')),
  full_name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  whatsapp_number VARCHAR(20),
  email VARCHAR(200),
  nationality VARCHAR(100),
  date_of_birth DATE,
  address TEXT,
  -- Document: Emirates ID
  emirates_id VARCHAR(20),
  emirates_id_expiry DATE,
  -- Document: Passport
  passport_number VARCHAR(50),
  passport_expiry DATE,
  -- Document: Visa
  visa_number VARCHAR(50),
  visa_expiry DATE,
  -- Document: Driving License
  driving_license_number VARCHAR(50) NOT NULL,
  license_expiry_date DATE NOT NULL,
  license_country VARCHAR(100) DEFAULT 'UAE',
  -- International Driving Permit (for tourists)
  idp_required BOOLEAN DEFAULT FALSE,
  idp_number VARCHAR(50),
  idp_expiry DATE,
  -- Links to parent entities
  customer_id UUID REFERENCES customers(id),
  company_id UUID,
  corporate_account_id UUID,
  user_id UUID REFERENCES users(id),
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_blacklisted BOOLEAN NOT NULL DEFAULT FALSE,
  blacklist_reason TEXT,
  -- Meta
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_driver_number_tenant UNIQUE (tenant_id, driver_number),
  CONSTRAINT uq_driver_license_tenant UNIQUE (tenant_id, driving_license_number)
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_tenant ON driver_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_customer ON driver_profiles(customer_id);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_type ON driver_profiles(tenant_id, driver_type);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_active ON driver_profiles(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_phone ON driver_profiles(tenant_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_driver_profiles_license ON driver_profiles(tenant_id, driving_license_number);

CREATE TRIGGER trg_driver_profiles_updated_at
  BEFORE UPDATE ON driver_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUPERADMIN SETTINGS TABLE (theme + feature flags)
-- ============================================================================
CREATE TABLE IF NOT EXISTS superadmin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Seed default feature flags
INSERT INTO superadmin_settings (setting_key, setting_value, description) VALUES
  ('feature_flags', '{"driver_module": true, "corporate_billing": true, "multi_branch": true, "toll_auto_attribution": true, "whatsapp_notifications": false, "sms_otp": true, "mobile_app": true, "customer_portal": true}', 'Feature flags for enabling/disabling modules'),
  ('theme', '{"primary_color": "#0E7490", "company_name": "CarRental ERP", "logo_url": null, "sidebar_color": "#0F172A"}', 'UI theme settings')
ON CONFLICT (setting_key) DO NOTHING;
