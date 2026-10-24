import type { Enums } from './database';

export type ServiceCategory = Enums<'service_category'>;
export type ServiceMode = Enums<'service_mode'>;
export type BookingMode = Enums<'booking_mode'>;

/**
 * The service categories, in display order.
 *
 * No emoji field. Categories are drawn with `<CategoryIcon>` in both apps — a round crop
 * of the category's own photography on web, the matching mark on mobile — so a glyph here
 * would only ever be a second, worse source of truth. Emoji render differently on every
 * platform and are not part of the brand.
 */
export const CATEGORIES: {
  value: ServiceCategory;
  label: string;
}[] = [
  { value: 'hairdresser', label: 'Hair' },
  { value: 'nail_technician', label: 'Nails' },
  { value: 'makeup_artist', label: 'Make-up' },
  { value: 'beautician', label: 'Beauty' },
  { value: 'tattoo_artist', label: 'Tattoo' },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<ServiceCategory, (typeof CATEGORIES)[number]>;

export function categoryLabel(c: ServiceCategory): string {
  return CATEGORY_MAP[c]?.label ?? c;
}

export const SERVICE_MODE_LABEL: Record<ServiceMode, string> = {
  studio: 'At my studio',
  mobile: 'I travel to clients',
  both: 'Studio & mobile',
};

export const BOOKING_MODE_LABEL: Record<BookingMode, string> = {
  studio: 'At their studio',
  mobile: 'They come to me',
};
