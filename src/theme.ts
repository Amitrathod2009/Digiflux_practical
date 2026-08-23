import type { TextStyle } from 'react-native';

export const color = {
  bg: '#EEF1EC',
  surface: '#FFFFFF',
  surfaceSunken: '#E4E9E2',
  ink: '#1B2A23',
  inkMuted: '#5C6B62',
  inkFaint: '#8A968E',
  accent: '#2F6D4F',
  accentSoft: '#DEEBE2',
  line: '#DCE2DB',
  danger: '#B3402A',
  dangerSoft: '#F6E3DE',
  pendingOverlay: 'rgba(255,255,255,0.55)',
} as const;

export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  s: 8,
  m: 14,
  pill: 999,
} as const;

export const type = {
  hero: {
    fontSize: 44,
    fontWeight: '800',
    color: color.ink,
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: color.ink,
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: color.ink,
  },
  bodyStrong: {
    fontSize: 15,
    fontWeight: '600',
    color: color.ink,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400',
    color: color.inkMuted,
  },
  overline: {
    fontSize: 11,
    fontWeight: '700',
    color: color.inkMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  num: {
    fontVariant: ['tabular-nums'],
  },
} satisfies Record<string, TextStyle>;
