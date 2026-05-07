-- Migration 014: Create rate_plans table
-- Feature: 006-erp-core-upgrade (US2: Snapshot Pricing)
-- Constitution: X. Snapshot Integrity — versioned rate plans

CREATE TABLE IF NOT EXISTS rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  daily_rate DECIMAL(10,2),
  weekly_rate DECIMAL(10,2),
  monthly_rate DECIMAL(10,2),
  included_km_per_day INTEGER NOT NULL DEFAULT 200,
  extra_km_rate DECIMAL(10,2) NOT NULL DEFAULT 0.50,
  fuel_policy JSONB DEFAULT '{"refill_rate": 100, "unit": "AED"}'::jsonb,
  late_return_rules JSONB DEFAULT '{"grace_period_minutes": 30, "hourly_rate": 10, "daily_cap": 150}'::jsonb,
  deposit_amount DECIMAL(10,2) DEFAULT 0,
  add_ons JSONB DEFAULT '[]'::jsonb,
  terms_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_rate_plan_version UNIQUE (tenant_id, name, version),
  CONSTRAINT chk_rate_plan_rate CHECK (daily_rate > 0 OR weekly_rate > 0 OR monthly_rate > 0),
  CONSTRAINT chk_rate_plan_extra_km CHECK (extra_km_rate >= 0),
  CONSTRAINT chk_rate_plan_deposit CHECK (deposit_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_rate_plans_tenant ON rate_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_plans_active ON rate_plans(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_rate_plans_name ON rate_plans(tenant_id, name);

DO $$ BEGIN
  CREATE TRIGGER trg_rate_plans_updated_at
    BEFORE UPDATE ON rate_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN null; END $$;

COMMENT ON TABLE rate_plans IS 'Versioned rate plan templates. Changes create new versions; existing agreements use snapshot values.';
