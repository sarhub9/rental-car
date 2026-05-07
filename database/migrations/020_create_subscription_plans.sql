-- Migration 020: Create subscription_plans table
-- Feature: SaaS - Subscription Plan Management

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price_monthly NUMERIC(10,2) NOT NULL,
  price_annual NUMERIC(10,2),
  features JSONB NOT NULL DEFAULT '{}',
  max_vehicles INTEGER,
  max_users INTEGER,
  max_agreements_per_month INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- Seed default plans
INSERT INTO subscription_plans (name, description, price_monthly, price_annual, features, max_vehicles, max_users, max_agreements_per_month, sort_order)
VALUES
  ('Free', 'Starter plan for small rental businesses', 0.00, 0.00,
   '{"agreements": true, "invoicing": false, "disputes": false, "kpi_dashboard": false, "audit_logs": false, "api_access": false, "multi_branch": false, "customer_portal": false}',
   5, 2, 10, 1),
  ('Basic', 'For growing rental businesses', 199.00, 1990.00,
   '{"agreements": true, "invoicing": true, "disputes": true, "kpi_dashboard": false, "audit_logs": false, "api_access": false, "multi_branch": false, "customer_portal": true}',
   50, 10, 500, 2),
  ('Premium', 'Full-featured plan for established businesses', 499.00, 4990.00,
   '{"agreements": true, "invoicing": true, "disputes": true, "kpi_dashboard": true, "audit_logs": true, "api_access": true, "multi_branch": true, "customer_portal": true}',
   NULL, NULL, NULL, 3)
ON CONFLICT DO NOTHING;
