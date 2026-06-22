-- Migration 029: Add document photo URL columns to customers and driver_profiles
-- Supports uploading Emirates ID (front/back), Driving License (front/back),
-- Passport and Visa photos for UAE residents, tourists and additional drivers.

-- ============================================================================
-- CUSTOMERS
-- ============================================================================
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS emirates_id_front_url TEXT,
  ADD COLUMN IF NOT EXISTS emirates_id_back_url  TEXT,
  ADD COLUMN IF NOT EXISTS license_front_url     TEXT,
  ADD COLUMN IF NOT EXISTS license_back_url      TEXT,
  ADD COLUMN IF NOT EXISTS passport_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS visa_photo_url        TEXT;

-- ============================================================================
-- DRIVER PROFILES (incl. additional drivers)
-- ============================================================================
ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS emirates_id_front_url TEXT,
  ADD COLUMN IF NOT EXISTS emirates_id_back_url  TEXT,
  ADD COLUMN IF NOT EXISTS license_front_url     TEXT,
  ADD COLUMN IF NOT EXISTS license_back_url      TEXT,
  ADD COLUMN IF NOT EXISTS passport_photo_url    TEXT,
  ADD COLUMN IF NOT EXISTS visa_photo_url        TEXT;
