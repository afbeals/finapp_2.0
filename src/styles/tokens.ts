export const colors = {
  navbar: '#0F172A',
  navbarText: '#E2E8F0',
  primary: '#3B82F6',
  primaryHover: '#2563EB',
  primaryLight: '#DBEAFE',
  bg: '#F1F5F9',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  success: '#22C55E',
  successLight: '#DCFCE7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  textPrimary: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textDisabled: '#94A3B8',
  // Member colors
  allan: '#3B82F6',
  malia: '#EC4899',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const font = {
  family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  size: {
    xs: '11px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '30px',
  },
  weight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
  md: '0 4px 6px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(15, 23, 42, 0.04)',
  lg: '0 10px 15px rgba(15, 23, 42, 0.10), 0 4px 6px rgba(15, 23, 42, 0.05)',
  xl: '0 20px 25px rgba(15, 23, 42, 0.10), 0 8px 10px rgba(15, 23, 42, 0.04)',
} as const;

export const transition = {
  fast: '100ms ease',
  base: '150ms ease',
  slow: '250ms ease',
} as const;

// Breakpoints (min-width)
export const bp = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;
