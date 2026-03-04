-- Seed: Test customer for OTP login testing
-- Phone: +971501234567
-- Tenant: 00000000-0000-0000-0000-000000000001

DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
  v_admin_id UUID;
BEGIN
  -- Get admin user ID for created_by_user_id
  SELECT id INTO v_admin_id FROM users
    WHERE tenant_id = v_tenant_id AND role = 'OWNER_ADMIN' LIMIT 1;

  -- If no admin exists yet, use a placeholder
  IF v_admin_id IS NULL THEN
    v_admin_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  -- Insert test customer
  INSERT INTO customers (
    tenant_id, customer_number, full_name_en, full_name_ar,
    phone_number, email, emirates_id, driving_license_number,
    license_expiry_date, customer_type, city, emirate,
    is_active, is_blacklisted, created_by_user_id
  ) VALUES (
    v_tenant_id, 'CUST-0001', 'Test Customer', 'عميل تجريبي',
    '+971501234567', 'test@customer.ae', '784-1990-1234567-1', 'DL-TEST-001',
    '2027-12-31', 'INDIVIDUAL', 'Dubai', 'Dubai',
    TRUE, FALSE, v_admin_id
  )
  ON CONFLICT (tenant_id, phone_number) DO NOTHING;

  RAISE NOTICE 'Test customer seeded: +971501234567 (CUST-0001)';
END $$;
