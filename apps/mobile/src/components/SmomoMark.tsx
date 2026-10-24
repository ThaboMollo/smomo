import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { fontFamily, tracking, useTheme } from '@/lib/theme';

/** The symbol's fixed aspect ratio, from the approved artwork trimmed to 734 × 665. */
const ASPECT = 734 / 665;

/**
 * The official SMOMO symbol: the approved flower with the S as a negative-space knockout.
 *
 * This is the same artwork the web renders, cropped and resized only — never redrawn,
 * outlined or distorted. The web uses it as a CSS alpha mask so it takes `currentColor`;
 * React Native has no CSS masks, so we get the same property from `expo-image`'s
 * `tintColor`, which recolours the bitmap by its opacity. Size it with `height`.
 */
export function SmomoMark({
  height = 32,
  color,
  label,
}: {
  height?: number;
  /** Defaults to the current text colour, mirroring the web's `currentColor` behaviour. */
  color?: string;
  /** Accessible name. Omit when decorative or sitting beside the wordmark. */
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <Image
      source={require('../../assets/brand/smomo-symbol.png')}
      tintColor={color ?? colors.text}
      contentFit="contain"
      style={{ height, width: height * ASPECT }}
      accessible={!!label}
      accessibilityLabel={label}
      accessibilityRole={label ? 'image' : undefined}
      {...(label ? {} : { accessibilityElementsHidden: true, importantForAccessibility: 'no' as const })}
    />
  );
}

/** Symbol plus the lowercase `smomo` wordmark, as one coordinated lockup. */
export function SmomoLockup({
  height = 32,
  color,
  label = 'SMOMO',
}: {
  height?: number;
  color?: string;
  label?: string;
}) {
  const { colors } = useTheme();
  const tint = color ?? colors.text;
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{ flexDirection: 'row', alignItems: 'center', gap: height * 0.3 }}
    >
      <SmomoMark height={height} color={tint} />
      <Text
        style={{
          color: tint,
          fontFamily: fontFamily.heading,
          fontSize: height * 0.88,
          letterSpacing: height * 0.88 * tracking.wordmark,
          lineHeight: height,
        }}
      >
        smomo
      </Text>
    </View>
  );
}
