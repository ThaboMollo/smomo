import type { ServiceCategory } from '@/lib/categories';

/**
 * The editorial photography the web uses for each craft. The files live in
 * `apps/web/public/editorial/` and are served from the site rather than bundled:
 * twenty WebP photographs would add meaningfully to the binary, and `expo-image`
 * handles WebP and on-disk caching already.
 *
 * Keep these paths in step with `CATEGORY_IMAGE` / `CATEGORY_HERO` in
 * `apps/web/src/lib/catalog.ts`.
 */
const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL ?? 'https://smomo.vercel.app').replace(
  /\/$/,
  '',
);

/** Portrait photo per craft: cards, thumbnails and avatar fallbacks. */
const CATEGORY_IMAGE: Record<ServiceCategory, string> = {
  hairdresser: '/editorial/look-hair-braids.webp',
  nail_technician: '/editorial/look-nails-chrome.webp',
  makeup_artist: '/editorial/look-makeup-portrait.webp',
  beautician: '/editorial/craft-facial.webp',
  tattoo_artist: '/editorial/look-tattoo-floral.webp',
};

/** Landscape "at work" photo per craft, for screen headers. */
const CATEGORY_HERO: Record<ServiceCategory, string> = {
  hairdresser: '/editorial/craft-hair-salon.webp',
  nail_technician: '/editorial/craft-nails-work.webp',
  makeup_artist: '/editorial/craft-makeup-work.webp',
  beautician: '/editorial/craft-facial.webp',
  tattoo_artist: '/editorial/craft-tattoo-work.webp',
};

export function categoryImage(c: ServiceCategory): string {
  return SITE_URL + CATEGORY_IMAGE[c];
}

export function categoryHero(c: ServiceCategory): string {
  return SITE_URL + CATEGORY_HERO[c];
}
