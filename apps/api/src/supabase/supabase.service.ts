import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@smomo/shared';

import type { PendingMigration16 } from './pending-migration-16';

/**
 * `supabase gen types` models an RPC argument that carries a DB default as `p_x?: T` —
 * optional, but never `null`. In Postgres those arguments are `default null` and accept
 * null perfectly well, and we *must* send an explicit null rather than omit the key:
 * PostgREST resolves an overload by the exact set of argument names in the body, and
 * supabase-js drops any key whose value is `undefined`. An omitted key can therefore
 * fail to resolve — that is spec RC-2, and the live 500 on `save_business_profile`.
 *
 * So the generated type pushes callers towards `?? undefined`, which is the broken form.
 * This widens every *optional* RPC argument to accept null, leaving required ones alone,
 * so the correct call is the one that typechecks. It lives here rather than in
 * `database.ts` because that file is overwritten by `pnpm gen:types`.
 */
type AcceptsNull<Args> = {
  [K in keyof Args]: undefined extends Args[K] ? Args[K] | null : Args[K];
};

type Fns = Database['public']['Functions'];

export type DbSchema = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Functions'> & {
    Functions: {
      // Every RPC except the three migration 16 reshapes, widened as described above.
      [K in Exclude<keyof Fns, keyof PendingMigration16>]: Omit<Fns[K], 'Args'> & {
        Args: AcceptsNull<Fns[K]['Args']>;
      };
      // Those three are REPLACED, not intersected: an intersection would keep the old
      // `p_lat: number` and `number & (number | null)` is still `number`.
      // See pending-migration-16.ts — delete it once the types are regenerated.
    } & PendingMigration16;
  };
};

export type Db = SupabaseClient<DbSchema>;

/**
 * Central Supabase access for the API (Hybrid model).
 * - `forUser(token)` → client scoped to the caller's JWT so RLS/RPCs enforce access.
 * - `getUser(token)` → validates a JWT via the auth server (short in-memory cache).
 *
 * Note: no service-role key is used — all data access goes through the user's JWT + RLS,
 * and admin actions are gated by the `is_admin()` RLS policy.
 */
@Injectable()
export class SupabaseService {
  private readonly url = process.env.SUPABASE_URL!;
  private readonly anonKey = process.env.SUPABASE_ANON_KEY!;

  private readonly authClient: Db;
  private readonly userCache = new Map<string, { user: User; expires: number }>();
  private static readonly CACHE_TTL_MS = 60_000;

  constructor() {
    if (!this.url || !this.anonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    this.authClient = createClient<DbSchema>(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  forUser(token: string | null | undefined): Db {
    return createClient<DbSchema>(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
    });
  }

  async getUser(token: string): Promise<User | null> {
    const now = Date.now();
    const cached = this.userCache.get(token);
    if (cached && cached.expires > now) return cached.user;

    const { data, error } = await this.authClient.auth.getUser(token);
    if (error || !data.user) return null;
    this.userCache.set(token, { user: data.user, expires: now + SupabaseService.CACHE_TTL_MS });
    return data.user;
  }
}
