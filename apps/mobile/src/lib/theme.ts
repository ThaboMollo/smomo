import { useColorScheme } from 'react-native';

import {
  darkColors,
  fontSize,
  lightColors,
  palette,
  radius,
  spacing,
  type AppColors,
} from '@smomo/ui-tokens';

export { palette, radius, spacing, fontSize };
export type { AppColors };

export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return { colors, scheme: scheme ?? 'light', radius, spacing, fontSize };
}

export type Theme = ReturnType<typeof useTheme>;
