import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

/**
 * Who is using the console, and what they are allowed to see.
 *
 * Two audiences share this app:
 *   * a **professional**, who manages their own business and sees only their own data;
 *   * **staff** (`profiles.is_admin`), who additionally see the platform sections.
 *
 * Role comes from `profiles`, read with the caller's own session so RLS applies — never
 * from a cookie, a query string or the JWT's own claims, none of which the database
 * enforces. Middleware has already established that there *is* a session; this is where
 * it becomes a role.
 */
export type ConsoleUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isStaff: boolean;
  isPractitioner: boolean;
  /** Set when they are a practitioner, for the verification banner. */
  verificationStatus: string | null;
  businessName: string | null;
};

export async function getConsoleUser(): Promise<ConsoleUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: practitioner }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, is_admin, is_practitioner')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('practitioner_profiles')
      .select('business_name, verification_status')
      .eq('id', user.id)
      .maybeSingle(),
  ]);

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    isStaff: !!profile?.is_admin,
    isPractitioner: !!profile?.is_practitioner,
    verificationStatus: practitioner?.verification_status ?? null,
    businessName: practitioner?.business_name ?? null,
  };
}

/** For any console page. Bounces to sign-in if the session evaporated mid-request. */
export async function requireUser(): Promise<ConsoleUser> {
  const user = await getConsoleUser();
  if (!user) redirect('/login');
  return user;
}

/**
 * For the staff-only sections. A professional who guesses the URL gets the same 404 as a
 * stranger rather than a "forbidden" page, so the console does not confirm which routes
 * exist. The database re-checks `is_admin()` inside every staff RPC regardless — this is
 * the fast gate, not the boundary.
 */
export async function requireStaff(): Promise<ConsoleUser> {
  const user = await requireUser();
  if (!user.isStaff) {
    const { notFound } = await import('next/navigation');
    notFound();
  }
  return user;
}
