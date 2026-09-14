'use client';

import { useQuery } from '@tanstack/react-query';

import type { PractitionerProfile, Profile, Subscription } from '@smomo/shared';

import { api } from '@/lib/api';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api.me.get() as Promise<{
        profile: Profile | null;
        practitioner: PractitionerProfile | null;
        subscription: Subscription | null;
      }>,
  });
}
