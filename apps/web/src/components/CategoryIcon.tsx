import Image from 'next/image';

import { CATEGORY_IMAGE, CATEGORY_SLUGS, SLUG_TO_CATEGORY, type CategorySlug } from '@/lib/catalog';

/**
 * Category mark: a small round crop of the category's photo.
 * Accepts either a marketing slug ('nail-technicians') or the shared
 * `service_category` enum value ('nail_technician').
 */
function toSlug(c: string): CategorySlug | null {
  if (c in SLUG_TO_CATEGORY) return c as CategorySlug;
  if (c in CATEGORY_SLUGS) return CATEGORY_SLUGS[c as keyof typeof CATEGORY_SLUGS];
  return null;
}

export function CategoryIcon({
  category,
  size = 20,
  className = '',
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  const slug = toSlug(category);
  if (!slug) return null;
  const px = Math.max(size + 8, 20);
  return (
    <Image
      src={CATEGORY_IMAGE[slug]}
      alt=""
      aria-hidden
      width={px}
      height={px}
      className={`inline-block shrink-0 rounded-full object-cover ${className}`}
      style={{ width: px, height: px }}
    />
  );
}
