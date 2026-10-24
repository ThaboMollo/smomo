import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';

import { useTheme } from '@/lib/theme';

/**
 * Thin Font Awesome wrapper, the counterpart of `apps/web/src/components/Icon.tsx`.
 * Same icon definitions, same default 16px, so the app's incidental marks are the
 * glyphs the site uses rather than lookalikes. Import defs from
 * '@fortawesome/free-solid-svg-icons'.
 */
export function Icon({
  icon,
  size = 16,
  color,
}: {
  icon: IconDefinition;
  size?: number;
  /** Defaults to the web's `text-primary-700`. */
  color?: string;
}) {
  const { colors } = useTheme();
  return <FontAwesomeIcon icon={icon} size={size} color={color ?? colors.primaryStrong} />;
}
