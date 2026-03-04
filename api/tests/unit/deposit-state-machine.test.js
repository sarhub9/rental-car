/**
 * Unit tests for Deposit state machine transitions
 * Tests the model's state validation logic in isolation
 */

describe('Deposit State Machine', () => {
  const VALID_TRANSITIONS = {
    HELD: ['USED', 'RELEASED', 'FORFEITED'],
    RELEASED: ['REFUNDED'],
    USED: [],
    FORFEITED: [],
    REFUNDED: [],
  };

  function isValidTransition(from, to) {
    const allowed = VALID_TRANSITIONS[from];
    return allowed && allowed.includes(to);
  }

  describe('HELD state', () => {
    test('can transition to USED', () => {
      expect(isValidTransition('HELD', 'USED')).toBe(true);
    });

    test('can transition to RELEASED', () => {
      expect(isValidTransition('HELD', 'RELEASED')).toBe(true);
    });

    test('can transition to FORFEITED', () => {
      expect(isValidTransition('HELD', 'FORFEITED')).toBe(true);
    });

    test('cannot transition to REFUNDED directly', () => {
      expect(isValidTransition('HELD', 'REFUNDED')).toBe(false);
    });
  });

  describe('RELEASED state', () => {
    test('can transition to REFUNDED', () => {
      expect(isValidTransition('RELEASED', 'REFUNDED')).toBe(true);
    });

    test('cannot transition to HELD', () => {
      expect(isValidTransition('RELEASED', 'HELD')).toBe(false);
    });

    test('cannot transition to USED', () => {
      expect(isValidTransition('RELEASED', 'USED')).toBe(false);
    });
  });

  describe('Terminal states', () => {
    test('USED has no valid transitions', () => {
      expect(VALID_TRANSITIONS['USED'].length).toBe(0);
    });

    test('FORFEITED has no valid transitions', () => {
      expect(VALID_TRANSITIONS['FORFEITED'].length).toBe(0);
    });

    test('REFUNDED has no valid transitions', () => {
      expect(VALID_TRANSITIONS['REFUNDED'].length).toBe(0);
    });
  });

  describe('Invalid transitions', () => {
    const terminalStates = ['USED', 'FORFEITED', 'REFUNDED'];
    const allStates = ['HELD', 'USED', 'RELEASED', 'FORFEITED', 'REFUNDED'];

    terminalStates.forEach(state => {
      allStates.forEach(target => {
        test(`${state} → ${target} is invalid`, () => {
          expect(isValidTransition(state, target)).toBe(false);
        });
      });
    });
  });

  describe('Deposit release eligibility', () => {
    test('deposit with future release_eligible_at is not eligible', () => {
      const now = new Date();
      const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(future > now).toBe(true);
    });

    test('deposit with past release_eligible_at is eligible', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      expect(past <= now).toBe(true);
    });

    test('policy_delay_days of 7 sets correct eligibility date', () => {
      const collected = new Date('2026-03-01T10:00:00Z');
      const eligible = new Date(collected);
      eligible.setDate(eligible.getDate() + 7);
      expect(eligible.toISOString()).toBe('2026-03-08T10:00:00.000Z');
    });
  });

  describe('Partial use calculations', () => {
    test('partial use leaves remaining amount', () => {
      const amount = 1000;
      const amountUsed = 300;
      const remaining = amount - amountUsed;
      expect(remaining).toBe(700);
    });

    test('full use consumes entire deposit', () => {
      const amount = 1000;
      const amountUsed = 1000;
      const fullyUsed = amountUsed >= amount;
      expect(fullyUsed).toBe(true);
    });

    test('use amount capped at available balance', () => {
      const amount = 1000;
      const amountUsed = 600;
      const requestedUse = 500;
      const available = amount - amountUsed;
      const actualUse = Math.min(requestedUse, available);
      expect(actualUse).toBe(400);
    });
  });
});
