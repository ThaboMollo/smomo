import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Supabase client for Server Components and Route Handlers, reading the session from
 * cookies so RLS applies to the signed-in person rather than to the anon key.
 *
 * `CookieOptions` comes from @supabase/ssr rather than being typed `any`: the shape is
 * published, and a cookie's `sameSite`/`secure`/`maxAge` are exactly the fields a mistake
 * here would silently get wrong.
 */
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
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component, where cookies are read-only. Safe to ignore:
            // the proxy refreshes them on the next request.
          }
        },
      },
    },
  );
}
