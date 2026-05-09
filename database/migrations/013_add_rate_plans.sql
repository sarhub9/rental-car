-- Migration 013: Add Rate Plans
-- Feature: Standalone RatePlan entity
-- Date: 2026-02-27

CREATE TABLE IF NOT EXISTS rate_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  plan_name VARCHAR(200) NOT NULL,
  plan_code VARCHAR(20) NOT NULL,
  base_daily_rate NUMERIC(10,2) NOT NULL,
  base_weekly_rate NUMERIC(10,2),
  km_allowance_per_day INTEGER NOT NULL DEFAULT 200,
  extra_km_rate NUMERIC(10,2) NOT NULL DEFAULT 0.50,
  fuel_policy VARCHAR(20) NOT NULL DEFAULT 'SAME_LEVEL',
  late_fee_per_hour NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  grace_period_minutes INTEGER NOT NULL DEFAULT 30,
  vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.0500,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, plan_code),
  CONSTRAINT chk_rate_plan_fuel_policy CHECK (fuel_policy IN ('SAME_LEVEL', 'FULL_TO_FULL')),
  CONSTRAINT chk_rate_plan_daily_rate CHECK (base_daily_rate > 0),
  CONSTRAINT chk_rate_plan_km CHECK (km_allowance_per_day > 0),
  CONSTRAINT chk_rate_plan_vat CHECK (vat_rate >= 0 AND vat_rate <= 1)
);

CREATE INDEX idx_rate_plans_tenant ON rate_plans(tenant_id);
CREATE INDEX idx_rate_plans_active ON rate_plans(tenant_id, is_active);

CREATE TRIGGER trg_rate_plans_updated_at
  BEFORE UPDATE ON rate_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mapping table: which rate plans apply to which vehicle categories
CREATE TABLE IF NOT EXISTS rate_plan_vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_plan_id UUID NOT NULL REFERENCES rate_plans(id) ON DELETE CASCADE,
  vehicle_category_id UUID NOT NULL REFERENCES vehicle_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (rate_plan_id, vehicle_category_id)
);

CREATE INDEX idx_rp_vc_rate_plan ON rate_plan_vehicle_categories(rate_plan_id);
CREATE INDEX idx_rp_vc_category ON rate_plan_vehicle_categories(vehicle_category_id);

COMMENT ON TABLE rate_plans IS 'Standalone rate plan definitions with pricing rules';
COMMENT ON TABLE rate_plan_vehicle_categories IS 'Mapping of rate plans to applicable vehicle categories';
