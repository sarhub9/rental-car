-- Migration 027: Soft Delete + 2FA support
-- Date: 2026-05-12

-- Soft delete for financial records
ALTER TABLE invoices               ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE rental_agreements      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE payments               ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE refund_requests        ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE expenses               ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customers              ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for soft-deleted records (fast exclusion)
CREATE INDEX IF NOT EXISTS idx_invoices_not_deleted    ON invoices(tenant_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_not_deleted    ON payments(tenant_id)    WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_customers_not_deleted   ON customers(tenant_id)   WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_agreements_not_deleted  ON rental_agreements(tenant_id) WHERE deleted_at IS NULL;

-- 2FA support on users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS twofa_enabled    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS twofa_secret     VARCHAR(200),
  ADD COLUMN IF NOT EXISTS twofa_otp        VARCHAR(10),
  ADD COLUMN IF NOT EXISTS twofa_otp_expiry TIMESTAMPTZ;

COMMENT ON COLUMN users.twofa_enabled IS 'Whether 2FA is enabled for this user';
COMMENT ON COLUMN users.twofa_otp     IS 'Temporary OTP for 2FA email verification';
