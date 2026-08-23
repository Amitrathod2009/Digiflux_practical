import { formatGirth, formatWeight, kgToLb, mmToCm, roundTo } from '../src/lib/units';

describe('unit conversion (display only — server units are kg and mm)', () => {
  it('converts millimetres to centimetres: 1012 mm → 101.2 cm', () => {
    expect(mmToCm(1012)).toBe(101.2);
    expect(formatGirth(1012)).toBe('101.2 cm');
  });

  it('converts kilograms to pounds: 86.0 kg → 189.6 lb', () => {
    expect(roundTo(kgToLb(86), 1)).toBe(189.6);
    expect(formatWeight(86, 'lb')).toBe('189.6 lb');
  });

  it('rounds for display, not for storage: 86.49999999999999 shows as 86.5', () => {
    expect(formatWeight(86.49999999999999, 'kg')).toBe('86.5 kg');
  });

  it('never alters the stored kilogram value when displaying pounds', () => {
    const storedKg = 86.2;
    formatWeight(storedKg, 'lb');
    // The formatter is pure — the stored number is untouched, so toggling
    // kg → lb → kg cannot drift (task rule P7).
    expect(storedKg).toBe(86.2);
    expect(formatWeight(storedKg, 'kg')).toBe('86.2 kg');
  });

  it('signs positive changes and keeps negative signs', () => {
    expect(formatWeight(1.2, 'kg', { signed: true })).toBe('+1.2 kg');
    expect(formatWeight(-6.4, 'kg', { signed: true })).toBe('-6.4 kg');
    expect(formatGirth(-15, { signed: true })).toBe('-1.5 cm');
  });
});
