import { Injectable } from '@nestjs/common';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@smomo/shared';

export type Db = SupabaseClient<Database>;

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
    this.authClient = createClient<Database>(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  forUser(token: string | null | undefined): Db {
    return createClient<Database>(this.url, this.anonKey, {
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
