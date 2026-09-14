import { Ionicons } from '@expo/vector-icons';
import { forwardRef } from 'react';
import {
  ActivityIndicator,
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

import { fontSize, radius, spacing, useTheme, type AppColors } from '@/lib/theme';

export { Ionicons };

/* ----------------------------- Text ----------------------------- */
type AppTextProps = TextProps & {
  variant?: 'display' | 'title' | 'heading' | 'body' | 'small' | 'caption';
  color?: keyof AppColors;
  weight?: '400' | '500' | '600' | '700';
  center?: boolean;
};

export function AppText({
  variant = 'body',
  color = 'text',
  weight,
  center,
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();
  const map = {
    display: { fontSize: fontSize.display, fontWeight: '700' as const },
    title: { fontSize: fontSize.xxl, fontWeight: '700' as const },
    heading: { fontSize: fontSize.lg, fontWeight: '600' as const },
    body: { fontSize: fontSize.md, fontWeight: '400' as const },
    small: { fontSize: fontSize.sm, fontWeight: '400' as const },
    caption: { fontSize: fontSize.xs, fontWeight: '500' as const },
  }[variant];
  return (
    <Text
      style={[
        map,
        { color: colors[color] },
        weight ? { fontWeight: weight } : null,
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

  const bg =
    variant === 'primary'
      ? colors.primary
      : variant === 'danger'
        ? colors.danger
        : variant === 'secondary'
          ? colors.cardMuted
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? colors.onPrimary
      : variant === 'ghost'
        ? colors.primary
        : colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          paddingVertical: size === 'lg' ? 15 : 11,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'ghost' && { borderWidth: 0 },
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={{ color: fg, fontSize: fontSize.md, fontWeight: '600' }}>{title}</Text>
        </View>
      )}
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
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.primary, fontWeight: '700', fontSize: size * 0.36 }}>
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
  const toneMap: Record<Tone, { bg: string; fg: string }> = {
    default: { bg: colors.cardMuted, fg: colors.textMuted },
    primary: { bg: colors.primarySoft, fg: colors.primary },
    success: { bg: colors.successSoft, fg: colors.success },
    warning: { bg: colors.warningSoft, fg: colors.warning },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  };
  const t = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={12} color={t.fg} /> : null}
      <Text style={{ color: t.fg, fontSize: fontSize.xs, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

/* ----------------------------- StarRating ----------------------------- */
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
  const v = value ?? 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const name = i <= Math.round(v) ? 'star' : 'star-outline';
        const star = <Ionicons key={i} name={name} size={size} color={colors.star} />;
        return onChange ? (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={6}>
            {star}
          </Pressable>
        ) : (
          star
        );
      })}
      {value != null ? (
        <Text style={{ color: colors.textMuted, fontSize: size, marginLeft: 4 }}>
          {v.toFixed(1)}
          {count != null ? ` (${count})` : ''}
        </Text>
      ) : count === 0 ? (
        <Text style={{ color: colors.textFaint, fontSize: size, marginLeft: 4 }}>New</Text>
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
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.card,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : null}
      <Text
        style={{
          color: selected ? colors.onPrimary : colors.text,
          fontWeight: '600',
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
  return (
    <View style={[styles.segmented, { backgroundColor: colors.cardMuted }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.segment,
              active && { backgroundColor: colors.card, ...styles.segmentActive },
            ]}
          >
            <Text
              style={{
                color: active ? colors.text : colors.textMuted,
                fontWeight: '600',
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
export function EmptyState({
  emoji = '🗒️',
  title,
  message,
  action,
}: {
  emoji?: string;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.empty}>
      <Text style={{ fontSize: 48 }}>{emoji}</Text>
      <AppText variant="heading" center>
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" color="textMuted" center>
          {message}
        </AppText>
      ) : null}
      {action ? <View style={{ marginTop: spacing.md, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

/* ----------------------------- Misc ----------------------------- */
export function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border }} />;
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 32, height: 32, justifyContent: 'center' },
  headerRight: { minWidth: 32, alignItems: 'flex-end' },
  btn: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: fontSize.md,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
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
  segmented: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
