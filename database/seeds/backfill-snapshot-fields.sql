-- Backfill: Populate snapshot fields on existing agreements from tenant_rules
-- Run ONCE after migration 013 is applied
-- Safe to re-run (only updates NULL snapshot fields)

UPDATE rental_agreements ra
SET
  rate_plan_name = 'Default (backfilled from tenant_rules)',
  snapshot_included_km = COALESCE(tr.km_allowance_per_day, 200) *
    GREATEST(1, CEIL(EXTRACT(EPOCH FROM ra.rental_end_datetime - ra.rental_start_datetime) / 86400)),
  snapshot_extra_km_rate = COALESCE(tr.rate_per_extra_km, 0.50),
  snapshot_deposit_amount = 0,
  snapshot_fuel_policy = jsonb_build_object('refill_rate', COALESCE(tr.fuel_refill_rate, 100), 'unit', 'AED'),
  snapshot_late_return_rules = jsonb_build_object(
    'grace_period_minutes', COALESCE(tr.grace_period_minutes, 30),
    'hourly_rate', COALESCE(tr.late_fee_per_hour, 10),
    'daily_cap', COALESCE(tr.late_fee_per_hour, 10) * 15
  ),
  snapshot_add_ons = '[]'::jsonb,
  snapshot_terms_text = NULL
FROM tenant_rules tr
WHERE tr.tenant_id = ra.tenant_id
  AND ra.snapshot_included_km IS NULL;

-- Create default rate plans from existing tenant_rules
INSERT INTO rate_plans (tenant_id, name, version, daily_rate, weekly_rate,
  included_km_per_day, extra_km_rate, fuel_policy, late_return_rules, deposit_amount)
SELECT
  tr.tenant_id,
  'Default',
  1,
  100, -- placeholder daily rate
  600, -- placeholder weekly rate
  tr.km_allowance_per_day,
  tr.rate_per_extra_km,
  jsonb_build_object('refill_rate', tr.fuel_refill_rate, 'unit', 'AED'),
  jsonb_build_object('grace_period_minutes', tr.grace_period_minutes, 'hourly_rate', tr.late_fee_per_hour, 'daily_cap', tr.late_fee_per_hour * 15),
  0
FROM tenant_rules tr
WHERE NOT EXISTS (
  SELECT 1 FROM rate_plans rp WHERE rp.tenant_id = tr.tenant_id AND rp.name = 'Default'
);
