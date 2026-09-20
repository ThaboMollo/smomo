import Image from 'next/image';

import { CATEGORY_SLUGS, SLUG_TO_CATEGORY, type CategorySlug } from '@/lib/catalog';

/**
 * Brand category mark. Replaces the old category emoji.
 * The source art is a gradient-violet illustration on a soft ground, so it is
 * matted in a small bordered "plate" (bg-card-muted) — consistent with the
 * editorial plate motif and safe on any surface.
 *
 * Accepts either a marketing slug ('nail-technicians') or the shared
 * `service_category` enum value ('nail_technician').
 */
const ICON: Record<CategorySlug, string> = {
  hairdressers: '/assets/hair_icon.png',
  'nail-technicians': '/assets/nail_icon.png',
  'makeup-artists': '/assets/make_up_icon.png',
  beauticians: '/assets/beauty_icon.png',
  'tattoo-artists': '/assets/tattoo_icon.png',
};

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
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded border border-border bg-card-muted p-0.5 ${className}`}
      aria-hidden
    >
      <Image src={ICON[slug]} alt="" width={size} height={size} className="h-auto w-auto" />
    </span>
  );
}
