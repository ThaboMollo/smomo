import { useContext } from 'react';
import { useColorScheme } from 'react-native';

import {
  darkColors,
  fontFamily,
  fontSize,
  lightColors,
  palette,
  radius,
  spacing,
  tracking,
  type AppColors,
} from '@smomo/ui-tokens';

import { ThemeContext } from '@/providers/ThemeProvider';

export { palette, radius, spacing, fontSize, fontFamily, tracking };
export type { AppColors };

/**
 * Resolved colours for the current theme. Reads the saved preference when a
 * `<ThemeProvider>` is above it and falls back to the OS setting otherwise, so this
 * keeps working in isolation (tests, storybook-style previews).
 */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  const osScheme = useColorScheme();
  const scheme = ctx ? ctx.scheme : (osScheme ?? 'light');
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, scheme, radius, spacing, fontSize };
}

export type Theme = ReturnType<typeof useTheme>;
