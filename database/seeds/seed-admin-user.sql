-- Seed: Default OWNER_ADMIN user for testing
-- Password: "Admin@123" (bcrypt hash)
-- NOTE: Replace tenant_id with your actual tenant UUID

-- To generate a new bcrypt hash, use:
-- node -e "const bcrypt = require('bcrypt'); bcrypt.hash('Admin@123', 12).then(h => console.log(h))"

DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001'; -- Replace with actual tenant ID
  v_password_hash VARCHAR := '$2b$12$GTluCj2ePukxr2AGUtWkCe0NvTMY4QydC4J2UjAc9.w6wOfsGf.qy'; -- Admin@123
BEGIN
  -- Insert admin user if not exists
  INSERT INTO users (
    tenant_id, phone_number, email, password_hash, role, status, full_name
  ) VALUES (
    v_tenant_id,
    '+971500000001',
    'admin@rental.ae',
    v_password_hash,
    'OWNER_ADMIN',
    'ACTIVE',
    'System Admin'
  )
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- Insert default tenant rules if not exists
  INSERT INTO tenant_rules (
    tenant_id, km_allowance_per_day, rate_per_extra_km,
    fuel_refill_rate, late_fee_per_hour, grace_period_minutes, rule_version
  ) VALUES (
    v_tenant_id, 200, 0.50, 100.00, 10.00, 30, 'V1'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Admin user seeded: admin@rental.ae / Admin@123';
END $$;
