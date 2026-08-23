export type RangeKey = '7d' | '30d' | '90d' | 'all';

export const RANGE_OPTIONS: Array<{ key: RangeKey; label: string; days: number | null }> = [
  { key: '7d', label: '7D', days: 7 },
  { key: '30d', label: '30D', days: 30 },
  { key: '90d', label: '90D', days: 90 },
  { key: 'all', label: 'All', days: null },
];

export const rangeLabel = (range: RangeKey): string =>
  RANGE_OPTIONS.find(o => o.key === range)?.label ?? range;

export function rangeFromISO(range: RangeKey, now: Date = new Date()): string | undefined {
  const option = RANGE_OPTIONS.find(o => o.key === range);
  if (!option || option.days === null) {
    return undefined;
  }
  return addDays(now, -option.days).toISOString();
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayLong(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function startedAgoLabel(startISO: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(startISO).getTime()) / 86400000));
  if (days < 1) {
    return 'started today';
  }
  return `started ${days}d ago`;
}
