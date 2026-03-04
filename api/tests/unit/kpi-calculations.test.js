/**
 * Unit tests for KPI calculation formulas
 */

describe('KPI Calculations', () => {
  describe('fleet utilization', () => {
    test('calculates utilization percentage', () => {
      const totalVehicles = 10;
      const periodDays = 30;
      const rentedDays = 200;
      const totalAvailableDays = totalVehicles * periodDays;
      const utilization = (rentedDays / totalAvailableDays) * 100;
      expect(utilization.toFixed(1)).toBe('66.7');
    });

    test('0% utilization when no rentals', () => {
      const totalAvailableDays = 10 * 30;
      const rentedDays = 0;
      const utilization = (rentedDays / totalAvailableDays) * 100;
      expect(utilization).toBe(0);
    });

    test('idle days = available - rented - downtime', () => {
      const totalAvailableDays = 300;
      const rentedDays = 200;
      const downtimeDays = 30;
      const idleDays = Math.max(0, totalAvailableDays - rentedDays - downtimeDays);
      expect(idleDays).toBe(70);
    });

    test('idle days cannot be negative', () => {
      const totalAvailableDays = 300;
      const rentedDays = 280;
      const downtimeDays = 30;
      const idleDays = Math.max(0, totalAvailableDays - rentedDays - downtimeDays);
      expect(idleDays).toBe(0);
    });
  });

  describe('revenue breakdown', () => {
    test('extras total is sum of charge types', () => {
      const charges = { EXTRA_KM: 500, LATE_FEE: 200, FUEL: 100, DAMAGE: 50 };
      const total = Object.values(charges).reduce((s, v) => s + v, 0);
      expect(total).toBe(850);
    });

    test('total revenue = base + extras', () => {
      const base = 10000;
      const extras = 850;
      expect(base + extras).toBe(10850);
    });
  });

  describe('risk metrics', () => {
    test('damage frequency = (incidents / agreements) × 100', () => {
      const incidents = 3;
      const totalAgreements = 30;
      const frequency = (incidents / totalAgreements) * 100;
      expect(frequency.toFixed(1)).toBe('10.0');
    });

    test('overdue rate = (overdue / total) × 100', () => {
      const overdue = 5;
      const total = 30;
      const rate = (overdue / total) * 100;
      expect(rate.toFixed(1)).toBe('16.7');
    });
  });

  describe('profit per vehicle', () => {
    test('margin = revenue - cost', () => {
      const revenue = 5000;
      const cost = 1200;
      const margin = revenue - cost;
      expect(margin).toBe(3800);
    });

    test('negative margin when cost exceeds revenue', () => {
      const revenue = 1000;
      const cost = 2500;
      const margin = revenue - cost;
      expect(margin).toBe(-1500);
    });

    test('total margin across fleet', () => {
      const vehicles = [
        { revenue: 5000, cost: 1200 },
        { revenue: 3000, cost: 800 },
        { revenue: 1000, cost: 2500 },
      ];
      const totalRevenue = vehicles.reduce((s, v) => s + v.revenue, 0);
      const totalCost = vehicles.reduce((s, v) => s + v.cost, 0);
      expect(totalRevenue - totalCost).toBe(4500);
    });
  });
});
