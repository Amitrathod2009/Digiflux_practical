export type WeightUnit = 'kg' | 'lb';

export const KG_PER_LB = 0.45359237;

export const kgToLb = (kg: number): number => kg / KG_PER_LB;

export const mmToCm = (mm: number): number => mm / 10;

export const roundTo = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

export function formatWeight(
  kg: number,
  unit: WeightUnit,
  opts: { withUnit?: boolean; signed?: boolean } = {},
): string {
  const { withUnit = true, signed = false } = opts;
  const value = unit === 'kg' ? kg : kgToLb(kg);
  const rounded = roundTo(value, 1);
  const sign = signed && rounded > 0 ? '+' : '';
  const text = `${sign}${rounded.toFixed(1)}`;
  return withUnit ? `${text} ${unit}` : text;
}

export function formatGirth(mm: number, opts: { signed?: boolean } = {}): string {
  const cm = roundTo(mmToCm(mm), 1);
  const sign = opts.signed && cm > 0 ? '+' : '';
  return `${sign}${cm.toFixed(1)} cm`;
}
