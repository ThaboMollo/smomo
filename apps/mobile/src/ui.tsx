import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type TextInputProps,
  type TextProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import {
  fontFamily,
  fontSize,
  radius,
  spacing,
  tracking,
  useTheme,
  type AppColors,
} from '@/lib/theme';

export { Ionicons };

/* ----------------------------- Text ----------------------------- */
type Weight = '400' | '500' | '600' | '700';

type AppTextProps = TextProps & {
  variant?: 'display' | 'title' | 'heading' | 'kicker' | 'body' | 'small' | 'caption';
  color?: keyof AppColors;
  weight?: Weight;
  center?: boolean;
};

/**
 * Space Grotesk carries the display sizes and DM Sans the body, matching the web.
 * With custom fonts the family file *is* the weight, so a `weight` prop picks a
 * different family rather than setting `fontWeight` — passing both makes Android
 * synthesise a second bold on top of an already-bold face.
 */
const DISPLAY_WEIGHT: Record<Weight, string> = {
  '400': fontFamily.headingMedium,
  '500': fontFamily.headingMedium,
  '600': fontFamily.heading,
  '700': fontFamily.heading,
};

const BODY_WEIGHT: Record<Weight, string> = {
  '400': fontFamily.body,
  '500': fontFamily.bodyMedium,
  '600': fontFamily.bodySemiBold,
  '700': fontFamily.bodyBold,
};

const TEXT_VARIANT = {
  display: {
    fontSize: fontSize.display,
    family: fontFamily.heading,
    display: true,
    letterSpacing: fontSize.display * tracking.display,
    lineHeight: fontSize.display * 1.06,
  },
  title: {
    fontSize: fontSize.xxl,
    family: fontFamily.heading,
    display: true,
    letterSpacing: fontSize.xxl * tracking.display,
    lineHeight: fontSize.xxl * 1.1,
  },
  heading: {
    fontSize: fontSize.lg,
    family: fontFamily.heading,
    display: true,
    letterSpacing: fontSize.lg * tracking.heading,
  },
  /** The web's uppercase label above a heading. */
  kicker: {
    fontSize: fontSize.xs,
    family: fontFamily.bodySemiBold,
    display: false,
    letterSpacing: fontSize.xs * tracking.kicker,
    textTransform: 'uppercase' as const,
  },
  body: { fontSize: fontSize.md, family: fontFamily.body, display: false },
  small: { fontSize: fontSize.sm, family: fontFamily.body, display: false },
  caption: { fontSize: fontSize.xs, family: fontFamily.bodyMedium, display: false },
} as const;

export function AppText({
  variant = 'body',
  color = 'text',
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const { family, display, ...typography } = TEXT_VARIANT[variant];
  const fontFamilyName = weight ? (display ? DISPLAY_WEIGHT : BODY_WEIGHT)[weight] : family;

  return (
    <Text
      style={[
        typography,
        { fontFamily: fontFamilyName, color: colors[color] },
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...rest}
    />
  );
}

/* ----------------------------- Screen ----------------------------- */
export function Screen({
  children,
  edges = ['top', 'bottom'],
  padded = false,
  scroll = false,
  style,
}: {
  children: React.ReactNode;
  edges?: Edge[];
  padded?: boolean;
  scroll?: boolean;
  style?: ViewProps['style'];
}) {
  const { colors } = useTheme();
  const inner = (
    <View style={[{ flex: 1 }, padded && { padding: spacing.lg }, style]}>{children}</View>
  );
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: colors.bg }}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padded && { padding: spacing.lg }]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

/* ----------------------------- Header ----------------------------- */
export function Header({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.headerBtn} />
      )}
      <View style={{ flex: 1 }}>
        <AppText variant="heading" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" color="textMuted" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/* ----------------------------- Button ----------------------------- */
type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  full?: boolean;
  style?: ViewProps['style'];
};

/**
 * Mirrors the web's `.btn` family: a pill with a 2px border box, 44px minimum target.
 * `primary` is ink on Signature Pink, which is the only pair that passes AA at this size —
 * white on that pink does not. Pressing inverts to ink the way the web's hover does.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  loading,
  disabled,
  icon,
  full = true,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const skin = {
    primary: {
      bg: colors.pink,
      fg: colors.onPink,
      border: 'transparent',
      pressedBg: colors.ink,
      pressedFg: colors.canvas,
    },
    secondary: {
      bg: 'transparent',
      fg: colors.text,
      border: colors.text,
      pressedBg: colors.text,
      pressedFg: colors.bg,
    },
    ghost: {
      bg: 'transparent',
      fg: colors.primary,
      border: 'transparent',
      pressedBg: 'transparent',
      pressedFg: colors.primaryDark,
    },
    danger: {
      bg: colors.card,
      fg: colors.danger,
      border: colors.danger,
      pressedBg: colors.dangerSoft,
      pressedFg: colors.danger,
    },
  }[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: pressed && !isDisabled ? skin.pressedBg : skin.bg,
          borderColor: skin.border,
          paddingVertical: size === 'lg' ? 14 : 10,
          opacity: isDisabled ? 0.5 : 1,
        },
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {({ pressed }) => {
        const fg = pressed && !isDisabled ? skin.pressedFg : skin.fg;
        return loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.btnInner}>
            {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
            <Text
              style={{ color: fg, fontSize: fontSize.sm + 1, fontFamily: fontFamily.bodyBold }}
            >
              {title}
            </Text>
          </View>
        );
      }}
    </Pressable>
  );
}

/* ----------------------------- Input ----------------------------- */
type InputProps = TextInputProps & { label?: string; error?: string; hint?: string };

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, hint, style, ...rest },
  ref,
) {
  const { colors } = useTheme();
  return (
    <View style={{ gap: 6, marginBottom: spacing.md }}>
      {label ? (
        <AppText variant="small" color="textMuted" weight="600">
          {label}
        </AppText>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textFaint}
        style={[
          styles.input,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
            fontFamily: fontFamily.body,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textFaint">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
});

/* ----------------------------- Card ----------------------------- */
export function Card({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewProps['style'];
}) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.9 }}>
        {content}
      </Pressable>
    );
  }
  return content;
}

/* ----------------------------- Avatar ----------------------------- */
export function Avatar({
  uri,
  name,
  size = 48,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
}) {
  const { colors } = useTheme();
  const initials =
    (name ?? '?')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.cardMuted }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.primaryStrong,
          fontFamily: fontFamily.bodyMedium,
          fontSize: size * 0.34,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

/* ----------------------------- Badge ----------------------------- */
type Tone = 'default' | 'primary' | 'success' | 'warning' | 'danger';
export function Badge({
  label,
  tone = 'default',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const { colors } = useTheme();
  // The web's badges are bordered pills; the border is what separates them from the card.
  const toneMap: Record<Tone, { bg: string; fg: string; border: string }> = {
    default: { bg: colors.cardMuted, fg: colors.textMuted, border: colors.border },
    primary: { bg: colors.primarySoft, fg: colors.primaryStrong, border: colors.primaryMuted },
    success: { bg: colors.successSoft, fg: colors.success, border: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger, border: colors.danger },
  };
  const t = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={{ color: t.fg, fontSize: fontSize.xs, fontFamily: fontFamily.bodyMedium }}>
        {label}
      </Text>
    </View>
  );
}

/* ----------------------------- StarRating ----------------------------- */
/**
 * Display and input are deliberately different shapes, following the web: a read-only
 * rating is one star plus the number (the web's `Stars`), while picking a rating needs
 * all five to be tappable.
 */
export function StarRating({
  value,
  count,
  size = 14,
  onChange,
}: {
  value: number | null | undefined;
  count?: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  const { colors } = useTheme();

  if (onChange) {
    const v = value ?? 0;
    return (
      <View
        style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        accessibilityRole="adjustable"
        accessibilityLabel={`Rating: ${v} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => onChange(i)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${i} out of 5`}
          >
            <Ionicons
              name={i <= Math.round(v) ? 'star' : 'star-outline'}
              size={size}
              color={colors.star}
            />
          </Pressable>
        ))}
      </View>
    );
  }

  if (value == null) {
    return (
      <AppText variant="small" color="textFaint">
        New
      </AppText>
    );
  }

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
      accessibilityLabel={`${value.toFixed(1)} out of 5 stars${count != null ? `, ${count} reviews` : ''}`}
    >
      <Ionicons name="star" size={size} color={colors.star} />
      <Text
        style={{ color: colors.text, fontSize: size, fontFamily: fontFamily.bodyMedium }}
      >
        {value.toFixed(1)}
      </Text>
      {count != null ? (
        <Text style={{ color: colors.textMuted, fontSize: size, fontFamily: fontFamily.body }}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

/* ----------------------------- Chip ----------------------------- */
export function Chip({
  label,
  emoji,
  selected,
  onPress,
}: {
  label: string;
  emoji?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  // Selected is an ink fill, not a pink one — the web reserves pink for buttons and
  // uses ink for the "chosen" state of chips and segments.
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.text : colors.card,
          borderColor: selected ? colors.text : colors.border,
        },
      ]}
    >
      {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : null}
      <Text
        style={{
          color: selected ? colors.bg : colors.text,
          fontFamily: fontFamily.bodyMedium,
          fontSize: fontSize.sm,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ----------------------------- Segmented ----------------------------- */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors } = useTheme();
  // The web's `.segmented`: a pill track with a 1px border, and the active segment is an
  // ink fill rather than a raised white card.
  return (
    <View
      accessibilityRole="radiogroup"
      style={[styles.segmented, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={[styles.segment, active && { backgroundColor: colors.text }]}
          >
            <Text
              style={{
                color: active ? colors.bg : colors.textMuted,
                fontFamily: active ? fontFamily.bodySemiBold : fontFamily.bodyMedium,
                fontSize: fontSize.sm,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ----------------------------- EmptyState ----------------------------- */
/**
 * The web's empty state is a dashed, brand-tinted box rather than loose centred text.
 * It keeps the per-state glyph each caller passes — that carries information the web's
 * single sparkle does not — and falls back to the sparkle when none is given.
 * `fill` centres the box in a flex parent, which is how every current caller uses it.
 */
export function EmptyState({
  emoji,
  title,
  message,
  action,
  fill = true,
}: {
  emoji?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
  fill?: boolean;
}) {
  const { colors } = useTheme();
  const box = (
    <View
      style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.primaryMuted }]}
    >
      {emoji ? (
        <Text style={{ fontSize: 30 }}>{emoji}</Text>
      ) : (
        <Ionicons name="sparkles" size={24} color={colors.primary} />
      )}
      <AppText variant="heading" center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" color="textMuted" center style={{ maxWidth: 320 }}>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: spacing.xs, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );

  if (!fill) return box;
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: spacing.lg }}>{box}</View>
  );
}

/* ----------------------------- Misc ----------------------------- */
export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
}

/**
 * The web's `Skeleton`: a pulsing tinted block for loading placeholders. Reanimated is
 * already a dependency, but a looped Animated opacity is enough here and avoids pulling
 * a worklet into every list cell.
 */
export function Skeleton({
  height = 16,
  width,
  style,
}: {
  height?: number;
  width?: number | `${number}%`;
  style?: ViewProps['style'];
}) {
  const { colors } = useTheme();
  // Lazy initial state rather than a ref: the value must survive re-renders, but reading
  // `ref.current` during render is what `react-hooks/refs` (correctly) forbids.
  const [pulse] = useState(() => new Animated.Value(0.5));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          height,
          width: width ?? '100%',
          borderRadius: radius.plate,
          backgroundColor: colors.primarySoft,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function Loader({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.loader}>
      <ActivityIndicator color={colors.primary} />
      {label ? (
        <AppText variant="small" color="textMuted">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

export function Row({ children, style, ...rest }: ViewProps) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]} {...rest}>
      {children}
    </View>
  );
}

export function IconButton({
  name,
  onPress,
  color,
  size = 22,
  ...rest
}: { name: keyof typeof Ionicons.glyphMap; color?: string; size?: number } & PressableProps) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} hitSlop={10} {...rest}>
      <Ionicons name={name} size={size} color={color ?? colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerRight: { minWidth: 32, alignItems: 'flex-end' },
  btn: {
    borderRadius: radius.pill,
    borderWidth: 2,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: fontSize.md,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  segmented: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: 40,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
