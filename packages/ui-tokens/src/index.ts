/**
 * Smomo brand tokens — framework-agnostic values shared by mobile (React Native) and
 * web (Tailwind). No React Native imports here so any consumer can use them.
 */
export const palette = {
  plum: '#6D28D9',
  plumDark: '#5B21B6',
  plumSoft: '#EDE9FE',
  berry: '#DB2777',
  gold: '#E0A400',
  star: '#F5A623',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  online: '#22C55E',
} as const;

export type AppColors = {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  onPrimary: string;
  bg: string;
  card: string;
  cardMuted: string;
  text: string;
  textMuted: string;
  textFaint: string;
  border: string;
  star: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  online: string;
  overlay: string;
};

export const lightColors: AppColors = {
  primary: palette.plum,
  primaryDark: palette.plumDark,
  primarySoft: palette.plumSoft,
  accent: palette.berry,
  onPrimary: '#FFFFFF',
  bg: '#FAF9FC',
  card: '#FFFFFF',
  cardMuted: '#F3F1F8',
  text: '#1A1523',
  textMuted: '#6B6577',
  textFaint: '#9A93A6',
  border: '#E7E3EF',
  star: palette.star,
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  online: palette.online,
  overlay: 'rgba(26,21,35,0.5)',
};

export const darkColors: AppColors = {
  primary: '#A78BFA',
  primaryDark: '#8B5CF6',
  primarySoft: '#2A2140',
  accent: '#F472B6',
  onPrimary: '#1A1523',
  bg: '#131019',
  card: '#1D1926',
  cardMuted: '#251F33',
  text: '#F5F3F9',
  textMuted: '#B3ACC2',
  textFaint: '#7E768F',
  border: '#302A40',
  star: palette.star,
  success: '#4ADE80',
  successSoft: '#14331F',
  warning: '#FBBF24',
  warningSoft: '#3A2C0A',
  danger: '#F87171',
  dangerSoft: '#3A1414',
  online: palette.online,
  overlay: 'rgba(0,0,0,0.6)',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;
