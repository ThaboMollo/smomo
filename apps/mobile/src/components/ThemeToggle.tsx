import { Pressable } from 'react-native';

import { useTheme } from '@/lib/theme';
import { useThemePreference, type ThemePreference } from '@/providers/ThemeProvider';
import { AppText, Ionicons, Row } from '@/ui';

const NEXT_LABEL: Record<ThemePreference, string> = {
  light: 'Switch to dark mode',
  dark: 'Follow system theme',
  system: 'Switch to light mode',
};

const ICON: Record<ThemePreference, keyof typeof Ionicons.glyphMap> = {
  light: 'sunny-outline',
  dark: 'moon-outline',
  system: 'contrast-outline',
};

const LABEL: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

/**
 * Steps light → dark → system, the same three states the web's toggle offers.
 * The choice is saved, so it survives a restart.
 */
export function ThemeToggle() {
  const { colors } = useTheme();
  const { preference, toggle } = useThemePreference();

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={NEXT_LABEL[preference]}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          minHeight: 40,
          paddingHorizontal: 14,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: pressed ? colors.cardMuted : colors.card,
        },
      ]}
    >
      <Row style={{ gap: 8 }}>
        <Ionicons name={ICON[preference]} size={18} color={colors.text} />
        <AppText variant="small" weight="500">
          {LABEL[preference]}
        </AppText>
      </Row>
    </Pressable>
  );
}
