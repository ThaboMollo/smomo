/**
 * Guard for the 2026-10-24 signup outage.
 *
 * handle_new_user() — the SECURITY DEFINER trigger on auth.users — still inserted
 * profiles.phone after migration 04 moved contact fields to profile_contact and
 * migration 10 dropped them. Every signup aborted with 42703 "column phone of relation
 * profiles does not exist", and nothing caught it because nothing exercised signup.
 * Last successful account creation was 2026-10-23 19:18 UTC; it went unnoticed until a
 * user reported it from the live site.
 *
 * This creates a real account, so it needs the service role to clean up afterwards.
 * Without SUPABASE_SERVICE_ROLE_KEY it skips loudly rather than leaving accounts behind.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { ANON, SB, SERVICE_ROLE, TEST_PASSWORD, api, asAdmin, login } from '../helpers/supa';

const created: string[] = [];
const canCleanUp = Boolean(SERVICE_ROLE);

afterAll(async () => {
  for (const id of created) {
    await asAdmin(`/auth/v1/admin/users/${id}`, 'DELETE').catch(() => {});
  }
}, 30_000);

describe.skipIf(!canCleanUp)('signup seeds a profile', () => {
  it('a new account can be created and lands with a profile row', async () => {
    const email = `smomo.test.signup${Date.now()}@example.com`;
    const res = await fetch(`${SB}/auth/v1/signup`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: TEST_PASSWORD,
        data: { full_name: 'Signup Guard' },
      }),
    });
    const body = await res.json();
    expect(res.status, `signup failed: ${JSON.stringify(body).slice(0, 300)}`).toBe(200);

    const id = body.user?.id ?? body.id;
    expect(id, 'signup returned no user id').toBeTruthy();
    created.push(id);

    // The trigger runs inside the auth.users insert: if it raises, signup 500s above.
    // This asserts the profile actually materialised, not just that auth succeeded.
    const token = await login(email);
    const { status, body: me } = await api(token, '/me');
    expect(status).toBe(200);
    expect(me.profile?.id).toBe(id);
    expect(me.profile?.full_name).toBe('Signup Guard');

    // A brand-new account must never arrive privileged.
    expect(me.profile?.is_admin, 'new account arrived with is_admin set').toBe(false);
    expect(me.profile?.is_practitioner).toBe(false);
  });
});

describe.skipIf(canCleanUp)('signup guard', () => {
  it.skip('needs SUPABASE_SERVICE_ROLE_KEY to create and clean up a throwaway account', () => {});
});
