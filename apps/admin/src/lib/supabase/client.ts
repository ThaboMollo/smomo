import { createBrowserClient } from '@supabase/ssr';

/**
 * NOTE: the client is deliberately NOT parameterised with `<Database>`.
 *
 * Typing it would be better, and it is how this file should eventually look, but
 * supabase-js's row inference currently resolves `.from('practitioner_profiles')
 * .select('id')` to `never` — reproducible with nothing but that one call, while the same
 * select on `profiles` infers correctly. That collapses every column read in the console
 * to an error. It is not caused by this app: no app in the repo types its Supabase client,
 * so the problem has simply never been hit. It is also not the PostGIS `unknown` columns
 * (fixed in `scripts/fix-geography-types.mjs`) nor the `PostgrestVersion` value — both
 * were tested and ruled out.
 *
 * Until that is diagnosed, reads here are unchecked, which is the same position as
 * `apps/web`. Worth returning to with a supabase-js upgrade.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
