import { rowDeltas, totalChange } from '../src/lib/stats';

// Lists are always sorted newest first, matching the app's list order.
describe('totalChange', () => {
  it('is newest minus oldest across the selected range', () => {
    expect(totalChange([86.0, 86.5, 92.4])).toBeCloseTo(-6.4);
  });

  it('is null for a single entry — no fake 0.0 change (P10)', () => {
    expect(totalChange([54.3])).toBeNull();
  });

  it('is null for an empty list', () => {
    expect(totalChange([])).toBeNull();
  });
});

describe('rowDeltas', () => {
  it('gives each row the change from the entry before it', () => {
    expect(rowDeltas([86.0, 86.5, 87.1])).toEqual([
      expect.closeTo(-0.5),
      expect.closeTo(-0.6),
      null,
    ]);
  });

  it('gives the oldest row no delta', () => {
    expect(rowDeltas([70.1])).toEqual([null]);
  });

  it('handles two entries on the same day (they stay distinct rows)', () => {
    // Client c4 has a morning and an evening entry on the same date.
    expect(rowDeltas([70.7, 70.4])).toEqual([expect.closeTo(0.3), null]);
  });
});
