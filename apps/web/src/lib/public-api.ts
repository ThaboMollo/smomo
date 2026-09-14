import type { Paginated, PublicProvider, PublicProviderListItem } from '@smomo/shared';

import { API_URL } from './env';

const REVALIDATE_PROFILE = 900; // 15 min
const REVALIDATE_LISTING = 3600; // 1 hour

async function get<T>(path: string, revalidate: number): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function getProvider(slug: string) {
  return get<PublicProvider>(`/public/providers/${encodeURIComponent(slug)}`, REVALIDATE_PROFILE);
}

export function getListing(category: string, city: string, limit = 24, offset = 0) {
  return get<Paginated<PublicProviderListItem>>(
    `/public/${category}/${city}?limit=${limit}&offset=${offset}`,
    REVALIDATE_LISTING,
  );
}

export function getCategoryHub(category: string, limit = 24, offset = 0) {
  return get<Paginated<PublicProviderListItem>>(
    `/public/${category}?limit=${limit}&offset=${offset}`,
    REVALIDATE_LISTING,
  );
}

export function getCityHub(city: string, limit = 24, offset = 0) {
  return get<Paginated<PublicProviderListItem>>(
    `/public/city/${city}?limit=${limit}&offset=${offset}`,
    REVALIDATE_LISTING,
  );
}
