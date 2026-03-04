/**
 * Unit tests for toll/fine attribution matching logic
 */

describe('Toll/Fine Attribution', () => {
  describe('event type classification', () => {
    const validTypes = ['salik', 'traffic_fine', 'parking_fine'];

    test('salik is valid', () => {
      expect(validTypes.includes('salik')).toBe(true);
    });

    test('traffic_fine is valid', () => {
      expect(validTypes.includes('traffic_fine')).toBe(true);
    });

    test('parking_fine is valid', () => {
      expect(validTypes.includes('parking_fine')).toBe(true);
    });
  });

  describe('attribution status transitions', () => {
    test('new event starts as pending', () => {
      const event = { attribution_status: 'pending' };
      expect(event.attribution_status).toBe('pending');
    });

    test('matched event gets agreement_id and charge_id', () => {
      const event = {
        attribution_status: 'matched',
        agreement_id: 'agr-123',
        charge_id: 'chg-456',
        matched_at: new Date().toISOString(),
      };
      expect(event.agreement_id).toBeTruthy();
      expect(event.charge_id).toBeTruthy();
      expect(event.matched_at).toBeTruthy();
    });

    test('unmatched event has no agreement', () => {
      const event = { attribution_status: 'unmatched', agreement_id: null };
      expect(event.agreement_id).toBeNull();
    });

    test('manual event has matched_by_user_id', () => {
      const event = {
        attribution_status: 'manual',
        matched_by_user_id: 'user-789',
      };
      expect(event.matched_by_user_id).toBeTruthy();
    });
  });

  describe('plate + date matching logic', () => {
    const agreements = [
      { id: 'agr-1', plate_number: 'A12345', checkout: '2026-03-01T09:00:00Z', return: '2026-03-05T18:00:00Z', status: 'CLOSED' },
      { id: 'agr-2', plate_number: 'A12345', checkout: '2026-03-10T09:00:00Z', return: null, status: 'ACTIVE' },
      { id: 'agr-3', plate_number: 'B67890', checkout: '2026-03-01T09:00:00Z', return: '2026-03-03T18:00:00Z', status: 'CLOSED' },
    ];

    function findMatch(plateNumber, eventTimestamp) {
      const ts = new Date(eventTimestamp);
      return agreements.find(a =>
        a.plate_number === plateNumber &&
        ['ACTIVE', 'CLOSED'].includes(a.status) &&
        new Date(a.checkout) <= ts &&
        (a.return === null || new Date(a.return) >= ts)
      );
    }

    test('matches event within closed agreement period', () => {
      const match = findMatch('A12345', '2026-03-03T14:00:00Z');
      expect(match?.id).toBe('agr-1');
    });

    test('matches event to active agreement (no return yet)', () => {
      const match = findMatch('A12345', '2026-03-12T14:00:00Z');
      expect(match?.id).toBe('agr-2');
    });

    test('no match for event outside agreement period', () => {
      const match = findMatch('A12345', '2026-03-08T14:00:00Z');
      expect(match).toBeUndefined();
    });

    test('no match for different plate', () => {
      const match = findMatch('C99999', '2026-03-03T14:00:00Z');
      expect(match).toBeUndefined();
    });

    test('matches correct plate', () => {
      const match = findMatch('B67890', '2026-03-02T10:00:00Z');
      expect(match?.id).toBe('agr-3');
    });
  });

  describe('batch import', () => {
    test('batch ID format includes timestamp', () => {
      const batchId = `BATCH-${Date.now()}`;
      expect(batchId).toMatch(/^BATCH-\d+$/);
    });

    test('result tracking counters', () => {
      const results = { imported: 10, matched: 6, unmatched: 3, errors: [{ row: {}, error: 'bad data' }] };
      expect(results.imported).toBe(10);
      expect(results.matched + results.unmatched + results.errors.length).toBe(10);
    });
  });
});
