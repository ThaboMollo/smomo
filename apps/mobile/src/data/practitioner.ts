import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import type { Coords } from '@/lib/location';
import { useAuth } from '@/providers/AuthProvider';
import type { SaveBusinessProfileInput, SaveServiceInput, ServiceCategory } from '@smomo/shared';

export type { Service, PortfolioItem, SaveBusinessProfileInput } from '@smomo/shared';
export type BusinessProfileInput = SaveBusinessProfileInput;

export function useSaveBusinessProfile() {
  const { refresh } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SaveBusinessProfileInput) => {
      await api.practitioner.saveBusiness(input);
      await refresh();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['provider'] }),
  });
}

export function useSetLocation() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (input: { coords: Coords; address?: string | null }) => {
      await api.practitioner.setLocation({
        lat: input.coords.latitude,
        lng: input.coords.longitude,
        address: input.address ?? null,
      });
      await refresh();
    },
  });
}

export function useSetPayshap() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (payshapProxy: string) => {
      await api.practitioner.setPayshap(payshapProxy);
      await refresh();
    },
  });
}

export function useToggleOnline() {
  const { refresh } = useAuth();
  return useMutation({
    mutationFn: async (isOnline: boolean) => {
      await api.practitioner.toggleOnline(isOnline);
      await refresh();
    },
  });
}

export function useServices(practitionerId: string | undefined) {
  return useQuery({
    queryKey: ['services', practitionerId],
    enabled: !!practitionerId,
    queryFn: () => api.practitioner.listServices(practitionerId!),
  });
}

export function useSaveService() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id?: string;
      category: ServiceCategory;
      title: string;
      description?: string;
      indicativePrice?: number | null;
      durationMinutes?: number | null;
    }) => api.practitioner.saveService(input as SaveServiceInput),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', userId] }),
  });
}

export function useDeleteService() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.practitioner.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services', userId] }),
  });
}

export function usePortfolio(practitionerId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', practitionerId],
    enabled: !!practitionerId,
    queryFn: () => api.practitioner.listPortfolio(practitionerId!),
  });
}

export function useAddPortfolioItem() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { imageUrl: string; caption?: string; category?: ServiceCategory | null }) =>
      api.practitioner.addPortfolioItem({
        imageUrl: input.imageUrl,
        caption: input.caption,
        category: input.category ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', userId] }),
  });
}

export function useDeletePortfolioItem() {
  const { userId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.practitioner.deletePortfolioItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portfolio', userId] }),
  });
}
