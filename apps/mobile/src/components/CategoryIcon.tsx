import { Image } from 'expo-image';

import type { ServiceCategory } from '@/lib/categories';
import { categoryImage } from '@/lib/catalog';
import { useTheme } from '@/lib/theme';

/**
 * Category mark: a small round crop of the craft's photo, matching
 * `apps/web/src/components/CategoryIcon.tsx`. The web never shows an emoji for a
 * category, so neither does the app.
 */
export function CategoryIcon({
  category,
  size = 20,
}: {
  category: ServiceCategory;
  size?: number;
}) {
  const { colors } = useTheme();
  // The web pads the requested size by 8 and floors at 20.
  const px = Math.max(size + 8, 20);
  return (
    <Image
      source={{ uri: categoryImage(category) }}
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        backgroundColor: colors.primarySoft,
      }}
      contentFit="cover"
      transition={120}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
