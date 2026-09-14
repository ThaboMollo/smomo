import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { BookingMode, ServiceCategory } from '@/lib/categories';
import type { Coords } from '@/lib/location';

export type { BookingRequest, RequestOffer, OfferWithProvider } from '@smomo/shared';

/* ------------------------ Client: create + list requests ------------------------ */
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category: ServiceCategory;
      bookingMode: BookingMode;
      coords: Coords;
      description?: string;
      address?: string;
      scheduledAt?: string | null;
      budgetMin?: number | null;
      budgetMax?: number | null;
      imageUrl?: string | null;
      targetPractitionerId?: string | null;
      consent?: boolean;
      expiresMinutes?: number;
    }): Promise<string> => {
      const res = await api.requests.create({
        category: input.category,
        bookingMode: input.bookingMode,
        lat: input.coords.latitude,
        lng: input.coords.longitude,
        description: input.description,
        address: input.address,
        scheduledAt: input.scheduledAt ?? null,
        budgetMin: input.budgetMin ?? null,
        budgetMax: input.budgetMax ?? null,
        imageUrl: input.imageUrl ?? null,
        targetPractitionerId: input.targetPractitionerId ?? null,
        consent: input.consent ?? false,
        expiresMinutes: input.expiresMinutes ?? 30,
      });
      return res.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-requests'] }),
  });
}

export function useMyRequests() {
  return useQuery({ queryKey: ['my-requests'], queryFn: () => api.requests.mine() });
}

export function useCancelRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => api.requests.cancel(requestId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-requests'] }),
  });
}

export function useRequestWithOffers(requestId: string | undefined) {
  return useQuery({
    queryKey: ['request', requestId],
    enabled: !!requestId,
    refetchInterval: 8000,
    queryFn: () => api.requests.get(requestId!),
  });
}

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offerId: string): Promise<string> => {
      const res = await api.offers.accept(offerId);
      return res.bookingId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-requests'] });
      qc.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/* ------------------------ Practitioner: feed + make offer ------------------------ */
export function usePractitionerFeed(enabled: boolean) {
  return useQuery({
    queryKey: ['feed'],
    enabled,
    refetchInterval: enabled ? 10000 : false,
    queryFn: () => api.feed.list(),
  });
}

export function useMakeOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestId: string; price: number; message?: string }) =>
      api.offers.make(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}
