-- Migration 005: Create users, otp_verifications, and refresh_tokens tables
-- Feature: Customer Portal - Phone + OTP Authentication

-- ============================================================================
-- USER ROLE AND STATUS ENUMS
-- ============================================================================
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN', 'OWNER_ADMIN', 'FRONT_DESK',
  'FLEET_MANAGER', 'ACCOUNTS', 'DRIVER_RECOVERY', 'RENTAL_CUSTOMER'
);

CREATE TYPE user_status AS ENUM ('ACTIVE', 'INACTIVE', 'LOCKED');

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  password_hash VARCHAR(200),
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'ACTIVE',

  -- Link to customer record (only for RENTAL_CUSTOMER role)
  customer_id UUID REFERENCES customers(id),

  -- Profile
  full_name VARCHAR(200) NOT NULL,
  profile_photo_url TEXT,

  -- Security
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_users_phone_tenant UNIQUE (tenant_id, phone_number),
  CONSTRAINT uq_users_email_tenant UNIQUE (tenant_id, email),
  CONSTRAINT uq_users_customer UNIQUE (customer_id),
  CONSTRAINT chk_customer_role CHECK (
    (role = 'RENTAL_CUSTOMER' AND customer_id IS NOT NULL)
    OR (role != 'RENTAL_CUSTOMER' AND customer_id IS NULL)
  )
);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(tenant_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_customer_id ON users(customer_id);

-- ============================================================================
-- OTP VERIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number VARCHAR(20) NOT NULL,
  tenant_id UUID NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  purpose VARCHAR(20) NOT NULL DEFAULT 'LOGIN'
    CHECK (purpose IN ('LOGIN', 'VERIFY_PHONE', 'TRANSACTION')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_otp_length CHECK (LENGTH(otp_code) = 6)
);

-- OTP indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone_tenant ON otp_verifications(tenant_id, phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications(expires_at);

-- ============================================================================
-- REFRESH TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  token_hash VARCHAR(200) NOT NULL,
  device_info JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Refresh token indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================================================
-- UPDATED_AT TRIGGER FOR USERS
-- ============================================================================
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
