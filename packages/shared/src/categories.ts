import type { Enums } from './database';

export type ServiceCategory = Enums<'service_category'>;
export type ServiceMode = Enums<'service_mode'>;
export type BookingMode = Enums<'booking_mode'>;

export const CATEGORIES: {
  value: ServiceCategory;
  label: string;
  emoji: string;
}[] = [
  { value: 'hairdresser', label: 'Hair', emoji: '💇' },
  { value: 'nail_technician', label: 'Nails', emoji: '💅' },
  { value: 'makeup_artist', label: 'Make-up', emoji: '💄' },
  { value: 'beautician', label: 'Beauty', emoji: '✨' },
  { value: 'tattoo_artist', label: 'Tattoo', emoji: '🖋️' },
];

const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<ServiceCategory, (typeof CATEGORIES)[number]>;

export function categoryLabel(c: ServiceCategory): string {
  return CATEGORY_MAP[c]?.label ?? c;
}

export function categoryEmoji(c: ServiceCategory): string {
  return CATEGORY_MAP[c]?.emoji ?? '✨';
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
