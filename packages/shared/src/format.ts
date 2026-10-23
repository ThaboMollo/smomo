import { formatDistanceToNow } from 'date-fns';

import { COUNTRIES, type CountryCode } from './countries';

export function formatZar(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return `R${Number(amount).toLocaleString('en-ZA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBudget(
  min: number | null | undefined,
  max: number | null | undefined,
): string | null {
  if (min != null && max != null) return `${formatZar(min)}–${formatZar(max)}`;
  if (min != null) return `from ${formatZar(min)}`;
  if (max != null) return `up to ${formatZar(max)}`;
  return null;
}

export function formatDistance(km: number | null | undefined): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return 'As soon as possible';
  const d = new Date(iso);
  return d.toLocaleString('en-ZA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateShort(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

export function timeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min left`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h left`;
  return `${Math.round(hrs / 24)} d left`;
}

/**
 * Normalise a phone number to E.164 (+<dial><number>). Numbers typed with a leading '+' or
 * '00' are taken as international; anything else is read as a local number in `country`
 * (default South Africa, which keeps the old behaviour). Returns null when the length
 * isn't plausible for that country, instead of saving something unusable.
 */
export function toE164(raw: string, country: CountryCode = 'ZA'): string | null {
  const cleaned = (raw ?? '').trim().replace(/[^\d+]/g, '');
  if (!cleaned) return null;

  if (cleaned.startsWith('+') || cleaned.startsWith('00')) {
    const digits = cleaned.replace(/^\+|^00/, '');
    return /^\d{8,15}$/.test(digits) ? `+${digits}` : null;
  }

  const c = COUNTRIES[country];
  let d = cleaned;
  // Typed with the country code but no '+', e.g. 27821234567.
  if (d.startsWith(c.dial) && c.nsn.includes(d.length - c.dial.length)) return `+${d}`;
  if (c.trunk && d.startsWith(c.trunk)) d = d.slice(1);
  return c.nsn.includes(d.length) ? `+${c.dial}${d}` : null;
}
