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
    micro: '9px',
    xxs: '10px',
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

export const semanticColors = {
  // Success
  successText:     '#15803D', // green-700
  successTextDark: '#166534', // green-800
  successTextDeep: '#065F46', // green-900
  successBg:       '#F0FDF4', // green-50
  successBorder:   '#86EFAC', // green-300

  // Warning
  warningText:         '#B45309', // amber-700
  warningBg:           '#FFFBEB', // amber-50
  warningBorder:       '#FCD34D', // yellow-300
  warningBorderStrong: '#FDE68A', // amber-200

  // Danger
  dangerText:     '#B91C1C', // red-700
  dangerTextDark: '#991B1B', // red-800
  dangerBg:       '#FEF2F2', // red-50
  dangerBorder:   '#FECACA', // red-200
  dangerHover:    '#DC2626', // red-600

  // Primary
  primaryText:     '#1D4ED8', // blue-700
  primaryTextDark: '#1E40AF', // blue-800
  primaryBg:       '#EFF6FF', // blue-50
  primaryBorder:   '#93C5FD', // blue-300

  // Purple
  purpleBg:       '#FAF5FF', // violet-50
  purpleLight:    '#EDE9FE', // violet-100
  purpleBorder:   '#C4B5FD', // violet-300
  purpleText:     '#6D28D9', // violet-700
  purpleTextDark: '#5B21B6', // violet-800
  purpleMedium:   '#8B5CF6', // violet-500

  // Info (sky)
  infoBg:     '#F0F9FF', // sky-50
  infoBorder: '#BAE6FD', // sky-200

  // Neutral
  surfaceMuted: '#F8FAFC', // slate-50
  neutralText:  '#475569', // slate-600

  // Purple (extended)
  purpleTextMedium: '#7C3AED', // violet-600

  // Success (extended)
  successTextMedium:  '#16A34A', // green-600
  successBright:      '#4ADE80', // green-400 (dark-bg contexts)
  successLightBorder: '#BBF7D0', // green-200

  // Danger (extended)
  dangerBright: '#F87171', // red-400 (dark-bg contexts)

  // Amber (orange-adjacent, distinct from warning/amber-700)
  amberText:   '#92400E', // amber-800
  amberBg:     '#FFF7ED', // orange-50
  amberBorder: '#FED7AA', // orange-200
  amberStrong: '#F97316', // orange-500
  amberHover:  '#EA580C', // orange-600

  // Teal (investments/vaults category palette)
  tealBg:         '#F0FDFA', // teal-50
  tealBorder:     '#5EEAD4', // teal-300
  tealLight:      '#CCFBF1', // teal-100
  tealText:       '#0F766E', // teal-700
  tealTextMedium: '#0D9488', // teal-600

  // Dark navy (extends colors.navbar for hover states)
  navyHover: '#1E293B', // slate-800

  // Navbar overlay tints (rgba white on dark bg)
  navbarOverlayLight: 'rgba(255,255,255,0.08)',
  navbarOverlayMid:   'rgba(255,255,255,0.15)',

  // Pink (investment badge palette)
  pinkBg:       '#FCE7F3', // pink-100
  pinkTextDark: '#9D174D', // pink-800

  // Orange (investment badge palette)
  orangeTextDark: '#C2410C', // orange-700
} as const;
