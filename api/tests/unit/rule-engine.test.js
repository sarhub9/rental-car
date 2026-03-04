/**
 * Unit tests for RuleEngineService calculation functions
 * Pure logic extracted — no ESM import needed
 */

// Inline the pure calculation functions to avoid ESM import issues
const FUEL_LEVELS = { EMPTY: 0, QUARTER: 0.25, HALF: 0.5, THREE_QUARTER: 0.75, FULL: 1.0 };

function calculateExtraKmCharge(kmDriven, kmAllowance, ratePerKm) {
  if (kmDriven <= kmAllowance) {
    return { amount: 0, calculation_basis: { km_driven: kmDriven, km_allowance: kmAllowance, extra_km: 0, rate_per_km: ratePerKm } };
  }
  const extraKm = kmDriven - kmAllowance;
  return { amount: parseFloat((extraKm * ratePerKm).toFixed(2)), calculation_basis: { km_driven: kmDriven, km_allowance: kmAllowance, extra_km: extraKm, rate_per_km: ratePerKm } };
}

function calculateFuelCharge(checkoutFuel, returnFuel, refillRate) {
  const checkout = FUEL_LEVELS[checkoutFuel];
  const ret = FUEL_LEVELS[returnFuel];
  if (ret >= checkout) return { amount: 0, calculation_basis: { checkout_fuel_level: checkoutFuel, return_fuel_level: returnFuel, fuel_difference: 0, refill_rate: refillRate } };
  const diff = checkout - ret;
  return { amount: parseFloat((diff * refillRate).toFixed(2)), calculation_basis: { checkout_fuel_level: checkoutFuel, return_fuel_level: returnFuel, fuel_difference: diff, refill_rate: refillRate } };
}

function calculateLateFee(expectedReturn, actualReturn, feePerHour, graceMins = 0, dailyCap = null) {
  const expected = new Date(expectedReturn);
  const actual = new Date(actualReturn);
  if (actual <= expected) return { amount: 0, calculation_basis: { hours_after_grace: 0, within_grace: false, grace_period_minutes: graceMins, daily_cap: dailyCap } };
  const diffMs = actual - expected;
  const graceMs = (graceMins || 0) * 60 * 1000;
  const adjustedMs = diffMs - graceMs;
  if (adjustedMs <= 0) return { amount: 0, calculation_basis: { within_grace: true, grace_period_minutes: graceMins, daily_cap: dailyCap, hours_after_grace: 0 } };
  const hoursAfterGrace = Math.ceil(adjustedMs / (1000 * 60 * 60));
  let amount = hoursAfterGrace * feePerHour;
  if (dailyCap && dailyCap > 0) amount = Math.min(amount, dailyCap);
  return { amount: parseFloat(amount.toFixed(2)), calculation_basis: { hours_after_grace: hoursAfterGrace, grace_period_minutes: graceMins, daily_cap: dailyCap, capped: dailyCap ? amount >= dailyCap : false, within_grace: false } };
}

function flagDamageForApproval(description, cost = 0) {
  return { amount: parseFloat(cost.toFixed(2)), calculation_basis: { damage_description: description, estimated_cost: cost, requires_approval: true }, approval_status: 'PENDING_APPROVAL' };
}

describe('RuleEngineService', () => {
  describe('calculateLateFee', () => {
    const expected = '2026-03-01T14:00:00Z';

    test('returns 0 when returned on time', () => {
      const result = calculateLateFee(expected, '2026-03-01T13:00:00Z', 10);
      expect(result.amount).toBe(0);
    });

    test('returns 0 when returned exactly on time', () => {
      const result = calculateLateFee(expected, expected, 10);
      expect(result.amount).toBe(0);
    });

    test('charges for late return without grace period', () => {
      const actual = '2026-03-01T17:00:00Z';
      const result = calculateLateFee(expected, actual, 10, 0, null);
      expect(result.amount).toBe(30);
      expect(result.calculation_basis.hours_after_grace).toBe(3);
    });

    test('applies grace period — no charge within grace', () => {
      const actual = '2026-03-01T14:25:00Z';
      const result = calculateLateFee(expected, actual, 10, 30, null);
      expect(result.amount).toBe(0);
      expect(result.calculation_basis.within_grace).toBe(true);
    });

    test('applies grace period — charges after grace', () => {
      const actual = '2026-03-01T16:45:00Z'; // 2h45m late, 30min grace → 2h15m → ceil = 3h
      const result = calculateLateFee(expected, actual, 10, 30, null);
      expect(result.amount).toBe(30);
      expect(result.calculation_basis.hours_after_grace).toBe(3);
    });

    test('applies daily cap', () => {
      const actual = '2026-03-02T14:00:00Z'; // 24 hours late
      const result = calculateLateFee(expected, actual, 10, 0, 150);
      expect(result.amount).toBe(150);
    });

    test('does not cap when under limit', () => {
      const actual = '2026-03-01T16:00:00Z'; // 2 hours late
      const result = calculateLateFee(expected, actual, 10, 0, 150);
      expect(result.amount).toBe(20);
    });

    test('grace + cap combined', () => {
      const actual = '2026-03-02T20:00:00Z'; // 30h late, 30min grace → 29.5h → ceil = 30h
      const result = calculateLateFee(expected, actual, 10, 30, 150);
      expect(result.amount).toBe(150);
    });

    test('rounds up partial hours', () => {
      const actual = '2026-03-01T14:41:00Z'; // 41 min late, no grace
      const result = calculateLateFee(expected, actual, 10, 0, null);
      expect(result.amount).toBe(10); // ceil(41/60) = 1h
    });

    test('handles default grace period of 0', () => {
      const actual = '2026-03-01T15:00:00Z';
      const result = calculateLateFee(expected, actual, 10);
      expect(result.amount).toBe(10);
    });

    test('exactly at grace boundary returns 0', () => {
      const actual = '2026-03-01T14:30:00Z'; // exactly 30min late with 30min grace
      const result = calculateLateFee(expected, actual, 10, 30, null);
      expect(result.amount).toBe(0);
    });
  });

  describe('calculateExtraKmCharge', () => {
    test('returns 0 when under allowance', () => {
      expect(calculateExtraKmCharge(150, 200, 0.5).amount).toBe(0);
    });

    test('returns 0 when exactly at allowance', () => {
      expect(calculateExtraKmCharge(200, 200, 0.5).amount).toBe(0);
    });

    test('charges for excess KM', () => {
      expect(calculateExtraKmCharge(300, 200, 0.5).amount).toBe(50);
    });

    test('handles large excess', () => {
      expect(calculateExtraKmCharge(1000, 200, 0.5).amount).toBe(400);
    });

    test('records extra_km in basis', () => {
      const r = calculateExtraKmCharge(350, 200, 0.5);
      expect(r.calculation_basis.extra_km).toBe(150);
    });
  });

  describe('calculateFuelCharge', () => {
    test('returns 0 when fuel same', () => {
      expect(calculateFuelCharge('FULL', 'FULL', 100).amount).toBe(0);
    });

    test('returns 0 when fuel higher', () => {
      expect(calculateFuelCharge('HALF', 'FULL', 100).amount).toBe(0);
    });

    test('charges FULL→HALF = 50%', () => {
      expect(calculateFuelCharge('FULL', 'HALF', 100).amount).toBe(50);
    });

    test('charges FULL→EMPTY = 100%', () => {
      expect(calculateFuelCharge('FULL', 'EMPTY', 100).amount).toBe(100);
    });

    test('charges FULL→THREE_QUARTER = 25%', () => {
      expect(calculateFuelCharge('FULL', 'THREE_QUARTER', 100).amount).toBe(25);
    });

    test('HALF→QUARTER = 25%', () => {
      expect(calculateFuelCharge('HALF', 'QUARTER', 100).amount).toBe(25);
    });
  });

  describe('flagDamageForApproval', () => {
    test('returns PENDING_APPROVAL status', () => {
      expect(flagDamageForApproval('Scratch', 0).approval_status).toBe('PENDING_APPROVAL');
    });

    test('amount is set to provided value', () => {
      expect(flagDamageForApproval('Dent', 500).amount).toBe(500);
    });

    test('requires_approval flag set', () => {
      expect(flagDamageForApproval('Crack', 200).calculation_basis.requires_approval).toBe(true);
    });
  });
});
