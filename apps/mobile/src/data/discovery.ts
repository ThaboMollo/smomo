import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { BookingMode, ServiceCategory } from '@/lib/categories';
import type { Coords } from '@/lib/location';

export type { ProviderCard, ProviderDetail } from '@smomo/shared';

export function useNearbyProviders(params: {
  coords: Coords | null;
  category?: ServiceCategory | null;
  mode?: BookingMode | null;
  maxKm?: number;
}) {
  const { coords, category, mode, maxKm = 50 } = params;
  return useQuery({
    queryKey: ['providers', coords?.latitude, coords?.longitude, category, mode, maxKm],
    enabled: !!coords,
    queryFn: () =>
      api.providers.search({
        lat: coords!.latitude,
        lng: coords!.longitude,
        category: category ?? undefined,
        mode: mode ?? undefined,
        maxKm,
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
