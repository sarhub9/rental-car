-- Seed: Test staff users for all roles
-- Password for all: "Test@1234"
-- Tenant: 00000000-0000-0000-0000-000000000001

DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
  v_password_hash VARCHAR := '$2b$12$GTluCj2ePukxr2AGUtWkCe0NvTMY4QydC4J2UjAc9.w6wOfsGf.qy'; -- Admin@123
BEGIN
  -- Front Desk
  INSERT INTO users (tenant_id, phone_number, email, password_hash, role, status, full_name)
  VALUES (v_tenant_id, '+971500000002', 'frontdesk@rental.ae', v_password_hash, 'FRONT_DESK', 'ACTIVE', 'Front Desk User')
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- Fleet Manager
  INSERT INTO users (tenant_id, phone_number, email, password_hash, role, status, full_name)
  VALUES (v_tenant_id, '+971500000003', 'fleet@rental.ae', v_password_hash, 'FLEET_MANAGER', 'ACTIVE', 'Fleet Manager')
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- Accounts
  INSERT INTO users (tenant_id, phone_number, email, password_hash, role, status, full_name)
  VALUES (v_tenant_id, '+971500000004', 'accounts@rental.ae', v_password_hash, 'ACCOUNTS', 'ACTIVE', 'Accounts User')
  ON CONFLICT (tenant_id, email) DO NOTHING;

  -- Driver/Recovery
  INSERT INTO users (tenant_id, phone_number, email, password_hash, role, status, full_name)
  VALUES (v_tenant_id, '+971500000005', 'driver@rental.ae', v_password_hash, 'DRIVER_RECOVERY', 'ACTIVE', 'Driver User')
  ON CONFLICT (tenant_id, email) DO NOTHING;

  RAISE NOTICE 'Test staff users seeded successfully';
END $$;
