/**
 * Smomo brand tokens — framework-agnostic values shared by mobile (React Native) and
 * web (Tailwind). No React Native imports here so any consumer can use them.
 *
 * These are the SMOMO 2.0 values, kept in step with the `@theme` block in
 * `apps/web/src/app/globals.css` (light) and its `html[data-theme='dark']` block (dark):
 * Midnight Ink #251719, Warm Canvas #F4EFE7, Signature Pink #E64D74,
 * Soft Lilac #C7B1F3, Electric Lime #CCF36D.
 *
 * When a web token changes, change it here too — the two are not generated from one source.
 */
export const palette = {
  /** Midnight Ink: body copy on canvas, and the ground of dark feature panels. */
  ink: '#251719',
  /** Warm Canvas: the default page ground. */
  canvas: '#F4EFE7',
  /** Signature Pink: fills. Carries ink text, never white — see `onPink`. */
  pink: '#E64D74',
  /** Deep pink: the accessible pink. Passes AA with white text and on canvas. */
  pinkDeep: '#AA204A',
  pinkDarker: '#8C1A3D',
  /** Soft Lilac: quiet accent, selection highlight. */
  lilac: '#C7B1F3',
  /** Electric Lime: accent on dark panels only — it has no contrast on canvas. */
  lime: '#CCF36D',
  line: '#D9D0C9',
  star: '#AA204A',
  success: '#15803D',
  successSoft: '#E6F4E9',
  warning: '#B45309',
  warningSoft: '#FBF0DC',
  danger: '#C0261D',
  dangerSoft: '#FBE9E6',
} as const;

export type AppColors = {
  /** The accessible deep pink. Text, icons and accents on canvas. */
  primary: string;
  primaryDark: string;
  /** web `primary-100` — tinted ground for soft badges and tiles. */
  primarySoft: string;
  /** web `primary-200` — active nav pills, avatar fallbacks. */
  primaryMuted: string;
  /** web `primary-700` — text sitting on `primarySoft` / `primaryMuted`. */
  primaryStrong: string;
  /** Signature Pink. Button and fill surfaces only. */
  pink: string;
  /** Ink text for use on `pink`; white on Signature Pink fails AA at button size. */
  onPink: string;
  /** Text colour that passes on a `primary` fill. */
  onPrimary: string;
  accent: string;
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
  /** Brand directs, for the places that need the raw colour regardless of theme. */
  ink: string;
  canvas: string;
  lilac: string;
  lime: string;
};

export const lightColors: AppColors = {
  primary: palette.pinkDeep,
  primaryDark: palette.pinkDarker,
  primarySoft: '#FCEBF0',
  primaryMuted: '#F9D6DF',
  primaryStrong: '#8C1A3D',
  pink: palette.pink,
  onPink: palette.ink,
  onPrimary: '#FFFFFF',
  accent: palette.lime,
  bg: palette.canvas,
  card: '#FFFFFF',
  cardMuted: '#FAF6F0',
  text: palette.ink,
  textMuted: '#5F5053',
  textFaint: '#6F6062',
  border: palette.line,
  star: palette.star,
  success: palette.success,
  successSoft: palette.successSoft,
  warning: palette.warning,
  warningSoft: palette.warningSoft,
  danger: palette.danger,
  dangerSoft: palette.dangerSoft,
  // Web's online dot is `bg-success`; keep them identical.
  online: palette.success,
  overlay: 'rgba(37,23,25,0.5)',
  ink: palette.ink,
  canvas: palette.canvas,
  lilac: palette.lilac,
  lime: palette.lime,
};

export const darkColors: AppColors = {
  // #C93A63 keeps white text above 4.5:1, which the Signature Pink does not.
  primary: '#C93A63',
  primaryDark: palette.pinkDeep,
  primarySoft: '#2E1D21',
  primaryMuted: '#3D262C',
  primaryStrong: '#F5B3C3',
  pink: palette.pink,
  onPink: palette.ink,
  onPrimary: '#FFFFFF',
  accent: palette.lime,
  bg: '#170F11',
  card: '#231719',
  cardMuted: '#2B1D20',
  text: palette.canvas,
  textMuted: '#C6B8BB',
  textFaint: '#A0919A',
  border: '#3D2D31',
  star: '#F5B3C3',
  success: '#4ADE80',
  successSoft: '#152C1C',
  warning: '#FBBF24',
  warningSoft: '#33250C',
  danger: '#FF8A80',
  dangerSoft: '#3A1A18',
  online: '#4ADE80',
  overlay: 'rgba(0,0,0,0.6)',
  ink: palette.ink,
  canvas: palette.canvas,
  lilac: palette.lilac,
  lime: palette.lime,
};

/**
 * Shapes, matched to the web's actual radii: inputs 14, thumbnails 18, plates 20,
 * cards 24, the brand radius 28, and pill for anything fully rounded.
 */
export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  plate: 20,
  xl: 24,
  brand: 28,
  pill: 999,
} as const;

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

/**
 * The two brand faces. `heading` is Space Grotesk (display), `body` is DM Sans.
 * The names are the keys registered with `useFonts` in the mobile root layout.
 */
export const fontFamily = {
  heading: 'SpaceGrotesk_700Bold',
  headingMedium: 'SpaceGrotesk_500Medium',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

/**
 * Display tracking. The web sets this in em (-0.035 to -0.04 on headings, -0.06 on the
 * wordmark); React Native needs absolute px, so multiply by the font size at the call site
 * or use these pre-computed values.
 */
export const tracking = {
  display: -0.04,
  heading: -0.035,
  wordmark: -0.06,
  kicker: 0.14,
} as const;
