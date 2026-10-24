import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { Pressable } from 'react-native';

import { Icon } from '@/components/Icon';
import { radius, useTheme } from '@/lib/theme';
import { useThemePreference, type ThemePreference } from '@/providers/ThemeProvider';
import { AppText, Row } from '@/ui';

/** Same three glyphs the web's `ThemeToggle` uses. */
const ICON = {
  light: faSun,
  dark: faMoon,
  system: faCircleHalfStroke,
} as const;

const LABEL: Record<ThemePreference, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

const NEXT_LABEL: Record<ThemePreference, string> = {
  light: 'Switch to dark mode',
  dark: 'Follow the system theme',
  system: 'Switch to light mode',
};

/**
 * Steps light → dark → system. The web keeps its toggle in the app header, so this is
 * rendered in the header too rather than buried in a signed-in-only section.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { colors } = useTheme();
  const { preference, toggle } = useThemePreference();

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel={NEXT_LABEL[preference]}
      hitSlop={8}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'flex-start',
          minHeight: 44,
          minWidth: 44,
          paddingHorizontal: compact ? 0 : 14,
          borderRadius: radius.pill,
          borderWidth: compact ? 0 : 1,
          borderColor: colors.border,
          backgroundColor: compact ? 'transparent' : pressed ? colors.cardMuted : colors.card,
          opacity: pressed && compact ? 0.6 : 1,
        },
      ]}
    >
      {compact ? (
        <Icon icon={ICON[preference]} size={18} color={colors.textMuted} />
      ) : (
        <Row style={{ gap: 8 }}>
          <Icon icon={ICON[preference]} size={16} color={colors.text} />
          <AppText variant="small" weight="500">
            {LABEL[preference]}
          </AppText>
        </Row>
      )}
    </Pressable>
  );
}
