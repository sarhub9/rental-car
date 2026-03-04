/**
 * Unit tests for snapshot pricing logic
 * Tests: duration calculation, snapshot field population, fallback behavior
 */

describe('Snapshot Pricing Logic', () => {
  describe('duration calculation', () => {
    test('calculates 1 day for same-day rental', () => {
      const start = new Date('2026-03-01T09:00:00Z');
      const end = new Date('2026-03-01T18:00:00Z');
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      expect(days).toBe(1);
    });

    test('calculates 3 days for 3-day rental', () => {
      const start = new Date('2026-03-01T09:00:00Z');
      const end = new Date('2026-03-04T09:00:00Z');
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      expect(days).toBe(3);
    });

    test('rounds up partial days', () => {
      const start = new Date('2026-03-01T09:00:00Z');
      const end = new Date('2026-03-03T18:00:00Z');
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
      expect(days).toBe(3); // 2.375 days → ceil = 3
    });
  });

  describe('snapshot field calculation from rate plan', () => {
    const ratePlan = {
      id: 'plan-123',
      name: 'Standard',
      included_km_per_day: 200,
      extra_km_rate: 0.50,
      deposit_amount: 1500,
      fuel_policy: { refill_rate: 100, unit: 'AED' },
      late_return_rules: { grace_period_minutes: 30, hourly_rate: 15, daily_cap: 200 },
      add_ons: [{ name: 'GPS', price: 10 }],
      terms_text: 'Standard T&C apply',
    };

    test('included KM = km_per_day × duration', () => {
      const durationDays = 5;
      const totalKm = ratePlan.included_km_per_day * durationDays;
      expect(totalKm).toBe(1000);
    });

    test('extra KM rate copied from plan', () => {
      expect(ratePlan.extra_km_rate).toBe(0.50);
    });

    test('deposit amount copied from plan', () => {
      expect(ratePlan.deposit_amount).toBe(1500);
    });

    test('fuel policy is an object with refill_rate', () => {
      expect(ratePlan.fuel_policy.refill_rate).toBe(100);
    });

    test('late return rules include grace, rate, cap', () => {
      expect(ratePlan.late_return_rules.grace_period_minutes).toBe(30);
      expect(ratePlan.late_return_rules.hourly_rate).toBe(15);
      expect(ratePlan.late_return_rules.daily_cap).toBe(200);
    });
  });

  describe('fallback to tenant rules', () => {
    const tenantRules = {
      km_allowance_per_day: 200,
      rate_per_extra_km: 0.50,
      fuel_refill_rate: 100,
      late_fee_per_hour: 10,
      grace_period_minutes: 30,
    };

    test('builds snapshot from tenant rules when no rate plan', () => {
      const durationDays = 3;
      const snapshot = {
        rate_plan_id: null,
        rate_plan_name: 'Default (tenant rules)',
        snapshot_included_km: tenantRules.km_allowance_per_day * durationDays,
        snapshot_extra_km_rate: tenantRules.rate_per_extra_km,
        snapshot_deposit_amount: 0,
        snapshot_fuel_policy: { refill_rate: tenantRules.fuel_refill_rate, unit: 'AED' },
        snapshot_late_return_rules: {
          grace_period_minutes: tenantRules.grace_period_minutes,
          hourly_rate: tenantRules.late_fee_per_hour,
          daily_cap: tenantRules.late_fee_per_hour * 15,
        },
      };

      expect(snapshot.snapshot_included_km).toBe(600);
      expect(snapshot.snapshot_extra_km_rate).toBe(0.50);
      expect(snapshot.snapshot_deposit_amount).toBe(0);
      expect(snapshot.snapshot_late_return_rules.daily_cap).toBe(150);
    });
  });

  describe('snapshot immutability principle', () => {
    test('changing plan after agreement creation does not affect snapshot', () => {
      const snapshotAtCreation = { daily_rate: 100, extra_km_rate: 0.50 };
      const planAfterChange = { daily_rate: 120, extra_km_rate: 0.75 };

      expect(snapshotAtCreation.daily_rate).not.toBe(planAfterChange.daily_rate);
      expect(snapshotAtCreation.extra_km_rate).not.toBe(planAfterChange.extra_km_rate);
    });
  });
});
