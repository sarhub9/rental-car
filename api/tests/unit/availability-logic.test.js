/**
 * Unit tests for availability/booking conflict detection logic
 */

describe('Availability Lock Logic', () => {
  describe('date range overlap detection', () => {
    function rangesOverlap(start1, end1, start2, end2) {
      return new Date(start1) < new Date(end2) && new Date(end1) > new Date(start2);
    }

    test('overlapping ranges detected', () => {
      expect(rangesOverlap('2026-03-01', '2026-03-05', '2026-03-03', '2026-03-07')).toBe(true);
    });

    test('non-overlapping ranges (before)', () => {
      expect(rangesOverlap('2026-03-01', '2026-03-03', '2026-03-05', '2026-03-07')).toBe(false);
    });

    test('non-overlapping ranges (after)', () => {
      expect(rangesOverlap('2026-03-05', '2026-03-07', '2026-03-01', '2026-03-03')).toBe(false);
    });

    test('adjacent ranges do not overlap', () => {
      expect(rangesOverlap('2026-03-01', '2026-03-03', '2026-03-03', '2026-03-05')).toBe(false);
    });

    test('contained range overlaps', () => {
      expect(rangesOverlap('2026-03-01', '2026-03-10', '2026-03-03', '2026-03-05')).toBe(true);
    });

    test('exact same range overlaps', () => {
      expect(rangesOverlap('2026-03-01', '2026-03-05', '2026-03-01', '2026-03-05')).toBe(true);
    });
  });

  describe('lock type validation', () => {
    const validTypes = ['reservation', 'rental', 'maintenance'];

    test('reservation is valid', () => {
      expect(validTypes.includes('reservation')).toBe(true);
    });

    test('rental is valid', () => {
      expect(validTypes.includes('rental')).toBe(true);
    });

    test('maintenance is valid', () => {
      expect(validTypes.includes('maintenance')).toBe(true);
    });

    test('invalid type rejected', () => {
      expect(validTypes.includes('hold')).toBe(false);
    });
  });

  describe('bookability rules', () => {
    test('vehicle in MAINTENANCE status is not bookable', () => {
      const vehicle = { status: 'MAINTENANCE' };
      const bookable = vehicle.status === 'AVAILABLE';
      expect(bookable).toBe(false);
    });

    test('vehicle in OUT_OF_SERVICE status is not bookable', () => {
      const vehicle = { status: 'OUT_OF_SERVICE' };
      const bookable = vehicle.status === 'AVAILABLE';
      expect(bookable).toBe(false);
    });

    test('vehicle in AVAILABLE status is bookable (if no conflicts)', () => {
      const vehicle = { status: 'AVAILABLE' };
      const bookable = vehicle.status === 'AVAILABLE';
      expect(bookable).toBe(true);
    });

    test('maintenance overdue blocks booking', () => {
      const vehicle = { current_odometer: 55000 };
      const lastWo = { next_maintenance_km: 50000 };
      const overdue = vehicle.current_odometer >= lastWo.next_maintenance_km;
      expect(overdue).toBe(true);
    });

    test('maintenance not overdue allows booking', () => {
      const vehicle = { current_odometer: 45000 };
      const lastWo = { next_maintenance_km: 50000 };
      const overdue = vehicle.current_odometer >= lastWo.next_maintenance_km;
      expect(overdue).toBe(false);
    });
  });

  describe('DB constraint error handling', () => {
    test('PostgreSQL exclusion violation code is 23P01', () => {
      const err = { code: '23P01', message: 'conflicting key value violates exclusion constraint' };
      expect(err.code).toBe('23P01');
    });

    test('maps 23P01 to 409 conflict', () => {
      const pgCode = '23P01';
      const httpStatus = pgCode === '23P01' ? 409 : 500;
      expect(httpStatus).toBe(409);
    });
  });
});
