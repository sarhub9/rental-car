-- Seed default company for existing data
-- This creates a company entry for the hardcoded tenant_id used in existing seeds

DO $$
DECLARE
  v_company_id UUID := '00000000-0000-0000-0000-000000000001';
  v_free_plan_id UUID;
BEGIN
  -- Insert default company
  INSERT INTO companies (id, name, contact_email, phone_number, status, trial_ends_at)
  VALUES (
    v_company_id,
    'Default Rental Company',
    'admin@rental.ae',
    '+971500000001',
    'ACTIVE',
    NOW() + INTERVAL '365 days'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Get Free plan ID
  SELECT id INTO v_free_plan_id FROM subscription_plans WHERE name = 'Free' LIMIT 1;

  -- Create subscription for default company
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO company_subscriptions (company_id, plan_id, status, current_period_start, current_period_end)
    VALUES (v_company_id, v_free_plan_id, 'ACTIVE', NOW(), NOW() + INTERVAL '365 days')
    ON CONFLICT (company_id) DO NOTHING;
  END IF;
END $$;
