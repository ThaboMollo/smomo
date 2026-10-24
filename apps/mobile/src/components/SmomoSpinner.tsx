import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { SmomoMark } from '@/components/SmomoMark';
import { fontFamily, fontSize, useTheme } from '@/lib/theme';

/** One full turn. Matches the web's `.smomo-spin` so both apps read as the same product. */
const DURATION = 1400;

const SIZES = { sm: 20, md: 36, lg: 64 } as const;

/**
 * The SMOMO loading spinner: the official symbol turning in place.
 *
 * `SmomoMark` recolours the approved artwork with `tintColor`, so this only rotates it —
 * the mark is never redrawn or distorted. Plain `Animated` rather than Reanimated, the
 * same choice `Skeleton` makes: a looped native-driver rotation needs no worklet.
 */
export function SmomoSpinner({
  size = 'md',
  color,
  label = 'Loading',
}: {
  size?: 'sm' | 'md' | 'lg';
  /** Defaults to the brand pink. Pass a colour when sitting on a pink fill. */
  color?: string;
  /** Accessible name. Pass `null` when something nearby already announces the wait. */
  label?: string | null;
}) {
  const { colors } = useTheme();
  // Lazy initial state, not a ref: the value must survive re-renders, and reading
  // `ref.current` during render is what `react-hooks/refs` forbids.
  const [turn] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((on) => {
        if (!cancelled) setReduceMotion(on);
      })
      .catch(() => {
        /* no answer — keep the rotation */
      });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    turn.setValue(0);
    // Asked for less motion: throb between full and faint instead of spinning.
    const loop = reduceMotion
      ? Animated.loop(
          Animated.sequence([
            Animated.timing(turn, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.timing(turn, { toValue: 0, duration: 800, useNativeDriver: true }),
          ]),
        )
      : Animated.loop(
          Animated.timing(turn, {
            toValue: 1,
            duration: DURATION,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        );
    loop.start();
    return () => loop.stop();
  }, [turn, reduceMotion]);

  const height = SIZES[size];
  const animatedStyle = reduceMotion
    ? { opacity: turn.interpolate({ inputRange: [0, 1], outputRange: [1, 0.3] }) }
    : {
        transform: [
          { rotate: turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
        ],
      };

  return (
    <Animated.View
      style={animatedStyle}
      accessible={!!label}
      accessibilityRole={label ? 'progressbar' : undefined}
      accessibilityLabel={label ?? undefined}
      {...(label
        ? {}
        : { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const })}
    >
      <SmomoMark height={height} color={color ?? colors.primary} />
    </Animated.View>
  );
}

/**
 * Full-screen wait: the spinner centred on the themed page ground at a faint opacity, so
 * what is behind stays visible but out of reach. `colors.bg` is the light or dark canvas,
 * which is how this follows the theme.
 *
 * Mounted globally by `<GlobalLoadingOverlay>`; render it directly only for a wait that
 * React Query does not drive.
 */
export function LoadingOverlay({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View
      // Covers the whole app including the tab bar, and swallows every touch beneath it.
      style={[StyleSheet.absoluteFill, styles.overlay]}
      accessibilityViewIsModal
      accessibilityLiveRegion="polite"
    >
      {/* The ground is its own layer so the opacity never reaches the spinner above it. */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg, opacity: 0.7 }]} />
      <SmomoSpinner size="lg" label={label ?? 'Loading'} />
      {label ? (
        // Plain Text rather than the shared `AppText`: `ui.tsx` imports this file for its
        // `Loader`, and importing back into `@/ui` would close a module cycle.
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    // zIndex orders it on iOS; Android needs elevation to clear the navigator's screens.
    zIndex: 100,
    elevation: 100,
  },
  label: { marginTop: 16, fontFamily: fontFamily.body, fontSize: fontSize.sm },
});
