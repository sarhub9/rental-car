-- Seed: Test vehicles for development
-- Tenant: 00000000-0000-0000-0000-000000000001

DO $$
DECLARE
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Toyota Camry
  INSERT INTO vehicles (
    tenant_id, vehicle_number, make, model, year, color,
    plate_number, plate_emirate, chassis_number,
    transmission_type, fuel_type, status,
    daily_rate, weekly_rate, current_odometer,
    registration_expiry, insurance_expiry
  ) VALUES (
    v_tenant_id, 'VH-001', 'Toyota', 'Camry', 2024, 'White',
    'A 12345', 'Dubai', 'JTDB1234567890001',
    'AUTOMATIC', 'PETROL', 'AVAILABLE',
    150.00, 900.00, 15000,
    '2027-06-30', '2027-06-30'
  ) ON CONFLICT (tenant_id, vehicle_number) DO NOTHING;

  -- Nissan Patrol
  INSERT INTO vehicles (
    tenant_id, vehicle_number, make, model, year, color,
    plate_number, plate_emirate, chassis_number,
    transmission_type, fuel_type, status,
    daily_rate, weekly_rate, current_odometer,
    registration_expiry, insurance_expiry
  ) VALUES (
    v_tenant_id, 'VH-002', 'Nissan', 'Patrol', 2023, 'Black',
    'B 67890', 'Dubai', 'JN1TB1234567890002',
    'AUTOMATIC', 'PETROL', 'AVAILABLE',
    350.00, 2100.00, 32000,
    '2027-03-15', '2027-03-15'
  ) ON CONFLICT (tenant_id, vehicle_number) DO NOTHING;

  -- Toyota Yaris
  INSERT INTO vehicles (
    tenant_id, vehicle_number, make, model, year, color,
    plate_number, plate_emirate, chassis_number,
    transmission_type, fuel_type, status,
    daily_rate, weekly_rate, current_odometer,
    registration_expiry, insurance_expiry
  ) VALUES (
    v_tenant_id, 'VH-003', 'Toyota', 'Yaris', 2024, 'Silver',
    'C 11111', 'Abu Dhabi', 'JTDY1234567890003',
    'AUTOMATIC', 'PETROL', 'AVAILABLE',
    100.00, 600.00, 8000,
    '2027-09-20', '2027-09-20'
  ) ON CONFLICT (tenant_id, vehicle_number) DO NOTHING;

  -- Hyundai Tucson
  INSERT INTO vehicles (
    tenant_id, vehicle_number, make, model, year, color,
    plate_number, plate_emirate, chassis_number,
    transmission_type, fuel_type, status,
    daily_rate, weekly_rate, current_odometer,
    registration_expiry, insurance_expiry
  ) VALUES (
    v_tenant_id, 'VH-004', 'Hyundai', 'Tucson', 2023, 'Blue',
    'D 22222', 'Sharjah', 'KMHJ1234567890004',
    'AUTOMATIC', 'PETROL', 'RENTED',
    200.00, 1200.00, 22000,
    '2027-05-10', '2027-05-10'
  ) ON CONFLICT (tenant_id, vehicle_number) DO NOTHING;

  -- Toyota Land Cruiser (Maintenance)
  INSERT INTO vehicles (
    tenant_id, vehicle_number, make, model, year, color,
    plate_number, plate_emirate, chassis_number,
    transmission_type, fuel_type, status,
    daily_rate, weekly_rate, current_odometer,
    registration_expiry, insurance_expiry
  ) VALUES (
    v_tenant_id, 'VH-005', 'Toyota', 'Land Cruiser', 2022, 'Grey',
    'E 33333', 'Dubai', 'JTMH1234567890005',
    'AUTOMATIC', 'DIESEL', 'MAINTENANCE',
    500.00, 3000.00, 65000,
    '2026-12-31', '2026-12-31'
  ) ON CONFLICT (tenant_id, vehicle_number) DO NOTHING;

  RAISE NOTICE 'Test vehicles seeded: 5 vehicles (3 available, 1 rented, 1 maintenance)';
END $$;
