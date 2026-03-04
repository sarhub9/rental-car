/**
 * Unit tests for Work Order status transitions
 */

describe('Work Order State Machine', () => {
  const VALID_TRANSITIONS = {
    open: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  function isValidTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from];
    return allowed && allowed.includes(to);
  }

  describe('open state', () => {
    test('can start (→ in_progress)', () => {
      expect(isValidTransition('open', 'in_progress')).toBe(true);
    });

    test('can cancel', () => {
      expect(isValidTransition('open', 'cancelled')).toBe(true);
    });

    test('cannot jump to completed', () => {
      expect(isValidTransition('open', 'completed')).toBe(false);
    });
  });

  describe('in_progress state', () => {
    test('can complete', () => {
      expect(isValidTransition('in_progress', 'completed')).toBe(true);
    });

    test('can cancel', () => {
      expect(isValidTransition('in_progress', 'cancelled')).toBe(true);
    });

    test('cannot go back to open', () => {
      expect(isValidTransition('in_progress', 'open')).toBe(false);
    });
  });

  describe('terminal states', () => {
    test('completed has no transitions', () => {
      expect(VALID_TRANSITIONS['completed'].length).toBe(0);
    });

    test('cancelled has no transitions', () => {
      expect(VALID_TRANSITIONS['cancelled'].length).toBe(0);
    });
  });

  describe('downtime calculation', () => {
    test('calculates days between start and completion', () => {
      const started = new Date('2026-03-01T09:00:00Z');
      const completed = new Date('2026-03-04T15:00:00Z');
      const downtimeDays = Math.max(1, Math.ceil((completed - started) / (1000 * 60 * 60 * 24)));
      expect(downtimeDays).toBe(4);
    });

    test('minimum 1 day downtime', () => {
      const started = new Date('2026-03-01T09:00:00Z');
      const completed = new Date('2026-03-01T10:00:00Z');
      const downtimeDays = Math.max(1, Math.ceil((completed - started) / (1000 * 60 * 60 * 24)));
      expect(downtimeDays).toBe(1);
    });
  });

  describe('work order number generation', () => {
    test('format is WO-YYYY-NNNNN', () => {
      const year = 2026;
      const seq = 1;
      const woNumber = `WO-${year}-${seq.toString().padStart(5, '0')}`;
      expect(woNumber).toBe('WO-2026-00001');
    });

    test('increments sequence', () => {
      const existing = 'WO-2026-00042';
      const seq = parseInt(existing.split('-')[2]) + 1;
      const next = `WO-2026-${seq.toString().padStart(5, '0')}`;
      expect(next).toBe('WO-2026-00043');
    });
  });
});
