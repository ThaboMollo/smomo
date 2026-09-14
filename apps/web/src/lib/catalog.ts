import type { Enums } from '@smomo/shared';

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

export const CATEGORY_EMOJI: Record<CategorySlug, string> = {
  'tattoo-artists': '🖋️',
  hairdressers: '💇',
  'nail-technicians': '💅',
  'makeup-artists': '💄',
  beauticians: '✨',
};

export const CATEGORY_SLUG_LIST = Object.keys(SLUG_TO_CATEGORY) as CategorySlug[];

export function isCategorySlug(v: string): v is CategorySlug {
  return v in SLUG_TO_CATEGORY;
}

/** Curated SA metros that get pre-generated pages; others render on-demand (ISR). */
export const CITIES = [
  'cape-town',
  'johannesburg',
  'durban',
  'pretoria',
  'gqeberha',
  'bloemfontein',
  'east-london',
  'polokwane',
  'nelspruit',
  'kimberley',
];

export function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
