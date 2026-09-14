import { createApiClient } from '@smomo/api-client';

import { createClient } from '@/lib/supabase/client';

/** Browser API client, authenticated with the current Supabase (cookie) session. */
export const api = createApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1',
  getToken: async () => {
    const { data } = await createClient().auth.getSession();
    return data.session?.access_token ?? null;
  },
});
