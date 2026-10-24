'use client';

import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

/**
 * The signed-in person, as `GET /me` actually returns them.
 *
 * The cast is gone: `api.me.get()` is typed `Me` in @smomo/shared, which includes the
 * fields the API re-flattens from the row-secured side tables (contact details, payout,
 * categories, social handles). This hook used to assert the bare `Profile` and
 * `PractitionerProfile` table rows, which claimed `profile.phone` and
 * `practitioner.categories` were still columns — migration 10 dropped both.
 */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.me.get(),
  });
}
