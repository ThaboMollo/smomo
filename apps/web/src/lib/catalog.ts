import { ALL_CITIES, COUNTRIES, cityBySlug, type Enums } from '@smomo/shared';

export type CategorySlug =
  | 'tattoo-artists'
  | 'hairdressers'
  | 'nail-technicians'
  | 'makeup-artists'
  | 'beauticians';

export const CATEGORY_SLUGS: Record<Enums<'service_category'>, CategorySlug> = {
  tattoo_artist: 'tattoo-artists',
  hairdresser: 'hairdressers',
  nail_technician: 'nail-technicians',
  makeup_artist: 'makeup-artists',
  beautician: 'beauticians',
};

export const SLUG_TO_CATEGORY: Record<CategorySlug, Enums<'service_category'>> = {
  'tattoo-artists': 'tattoo_artist',
  hairdressers: 'hairdresser',
  'nail-technicians': 'nail_technician',
  'makeup-artists': 'makeup_artist',
  beauticians: 'beautician',
};

export const CATEGORY_LABEL: Record<CategorySlug, string> = {
  'tattoo-artists': 'Tattoo Artists',
  hairdressers: 'Hairdressers',
  'nail-technicians': 'Nail Technicians',
  'makeup-artists': 'Make-up Artists',
  beauticians: 'Beauticians',
};

// No CATEGORY_EMOJI map: categories are drawn with <CategoryIcon>, which crops
// CATEGORY_IMAGE. Emoji are not part of the brand and render differently per platform.

export const CATEGORY_SLUG_LIST = Object.keys(SLUG_TO_CATEGORY) as CategorySlug[];

export function isCategorySlug(v: string): v is CategorySlug {
  return v in SLUG_TO_CATEGORY;
}

/** South African metros: these get pre-generated pages; every other city renders on demand (ISR). */
export const CITIES = COUNTRIES.ZA.cities.map((c) => c.slug);

/** Every city SMOMO publishes a page for, across all six countries. */
export const ALL_CITY_SLUGS = ALL_CITIES.map((c) => c.slug);

/** Display name for a city slug ("windhoek" → "Windhoek"), falling back to title case for unknown slugs. */
export function cityLabel(slug: string): string {
  return cityBySlug(slug)?.name ?? titleCase(slug);
}

/** "Maseru, Lesotho" for known cities, otherwise just the name. */
export function cityWithCountry(slug: string): string {
  const c = cityBySlug(slug);
  return c ? `${c.name}, ${COUNTRIES[c.country].name}` : titleCase(slug);
}
export function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** One-line note shown under each category tile. */
export const CATEGORY_NOTE: Record<CategorySlug, string> = {
  hairdressers: 'Braids, silk presses, cuts and colour',
  'nail-technicians': 'Gel, BIAB and structured manicures',
  'makeup-artists': 'Bridal, editorial and event looks',
  beauticians: 'Facials, lashes and skin treatments',
  'tattoo-artists': 'Fine-line, blackwork and cover-ups',
};

/** Portrait editorial photo per category: thumbnails, cards and fallbacks (from /public/editorial). */
export const CATEGORY_IMAGE: Record<CategorySlug, string> = {
  hairdressers: '/editorial/look-hair-braids.webp',
  'nail-technicians': '/editorial/look-nails-chrome.webp',
  'makeup-artists': '/editorial/look-makeup-portrait.webp',
  beauticians: '/editorial/craft-facial.webp',
  'tattoo-artists': '/editorial/look-tattoo-floral.webp',
};

/** Landscape "at work" photo per category, used in page headers. */
export const CATEGORY_HERO: Record<CategorySlug, string> = {
  hairdressers: '/editorial/craft-hair-salon.webp',
  'nail-technicians': '/editorial/craft-nails-work.webp',
  'makeup-artists': '/editorial/craft-makeup-work.webp',
  beauticians: '/editorial/craft-facial.webp',
  'tattoo-artists': '/editorial/craft-tattoo-work.webp',
};

/** Category image keyed by the shared `service_category` enum value. */
export function categoryImage(c: Enums<'service_category'>): string {
  return CATEGORY_IMAGE[CATEGORY_SLUGS[c]];
}
