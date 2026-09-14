import { createApiClient } from '@smomo/api-client';

import { supabase } from '@/lib/supabase';

const baseUrl = process.env.EXPO_PUBLIC_API_URL;
if (!baseUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL in .env');
}

/** Shared API client, authenticated with the current Supabase session token. */
export const api = createApiClient({
  baseUrl,
  getToken: async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },
});
