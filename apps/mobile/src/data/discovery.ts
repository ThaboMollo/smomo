import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { BookingMode, ServiceCategory } from '@/lib/categories';
import type { Coords } from '@/lib/location';

export type { ProviderCard, ProviderDetail } from '@smomo/shared';

/**
 * Nearby providers — by distance when we have a position, by city when we don't.
 *
 * Since migration 16 the search needs one or the other, not both: with geolocation parked
 * there are no coordinates, and `city` is what the RPC matches on (returning `distance_km`
 * as null so the cards know to hide it).
 */
export function useNearbyProviders(params: {
  coords: Coords | null;
  /** Search centre by name, for when there is no position. */
  city?: string | null;
  category?: ServiceCategory | null;
  mode?: BookingMode | null;
  maxKm?: number;
}) {
  const { coords, city, category, mode, maxKm = 50 } = params;
  return useQuery({
    queryKey: ['providers', coords?.latitude, coords?.longitude, city, category, mode, maxKm],
    enabled: !!coords || !!city?.trim(),
    queryFn: () =>
      api.providers.search({
        lat: coords?.latitude ?? null,
        lng: coords?.longitude ?? null,
        category: category ?? undefined,
        mode: mode ?? undefined,
        maxKm,
        city: city ?? null,
      }),
  });
}

export function useProviderDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['provider', id],
    enabled: !!id,
    queryFn: () => api.providers.get(id!),
  });
}
