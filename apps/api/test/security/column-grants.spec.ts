/**
 * Guard for spec RC-1 / Phase 1.
 *
 * Before migration 12, `authenticated` held table-wide UPDATE on every table and each
 * *_update_own policy was row-scoped only — so "my row" meant "every column of my row".
 * A user could PATCH profiles.is_admin = true and, because is_admin() is
 * `select is_admin from profiles where id = auth.uid()`, become a full admin.
 *
 * These specs attack via PostgREST directly, not through the API: the API not offering
 * an endpoint proves nothing, because the anon key and the user's own JWT are enough to
 * reach the table. Each case snapshots the column, attempts the write, asserts the value
 * did not move, and restores in a finally — so a FAILING run still leaves the row clean.
 *
 * Assert on the re-read value, never on the HTTP status: a blocked column write can come
 * back 200 with zero rows affected (spec RC-4).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { ACCOUNTS, login, readColumn, rest } from '../helpers/supa';

type Ctx = { token: string; id: string };
const ctx: Record<'client' | 'pro', Ctx> = {} as any;

async function whoami(token: string): Promise<string> {
  const { body } = await rest(token, '/profiles?select=id&limit=1');
  // RLS lets a user read all profiles, so resolve identity from the JWT instead.
  const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
  return claims.sub as string;
}

beforeAll(async () => {
  for (const key of ['client', 'pro'] as const) {
    const token = await login(ACCOUNTS[key]);
    ctx[key] = { token, id: await whoami(token) };
  }
}, 30_000);

/**
 * Attempt to write `value` to `table.column` for the caller's own row and assert the
 * stored value is unchanged.
 */
async function expectColumnWithheld(
  who: 'client' | 'pro',
  table: string,
  column: string,
  value: unknown,
) {
  const { token, id } = ctx[who];
  const before = await readColumn(token, table, id, column);
  try {
    await rest(token, `/${table}?id=eq.${id}`, 'PATCH', { [column]: value });
    const after = await readColumn(token, table, id, column);
    expect(
      after,
      `${table}.${column} was writable by its owner (${String(before)} -> ${String(after)})`,
    ).toEqual(before);
  } finally {
    const now = await readColumn(token, table, id, column);
    if (now !== before) {
      // Best effort: only possible while the hole is still open, which is the point.
      await rest(token, `/${table}?id=eq.${id}`, 'PATCH', { [column]: before });
    }
  }
}

describe('profiles: authority and trust columns are not self-writable', () => {
  it('is_admin cannot be self-granted (full privilege escalation)', async () => {
    await expectColumnWithheld('client', 'profiles', 'is_admin', true);
  });

  it('is_admin cannot be self-granted by a practitioner either', async () => {
    await expectColumnWithheld('pro', 'profiles', 'is_admin', true);
  });

  it('client_rating cannot be fabricated', async () => {
    await expectColumnWithheld('client', 'profiles', 'client_rating', 5);
  });

  it('client_rating_count cannot be fabricated', async () => {
    await expectColumnWithheld('client', 'profiles', 'client_rating_count', 999);
  });
});

describe('practitioner_profiles: verification and trust signals are not self-writable', () => {
  it('verification_status cannot be self-verified', async () => {
    await expectColumnWithheld('pro', 'practitioner_profiles', 'verification_status', 'verified');
  });

  it('verified_at cannot be stamped', async () => {
    await expectColumnWithheld('pro', 'practitioner_profiles', 'verified_at', new Date().toISOString());
  });

  it('rating cannot be fabricated', async () => {
    await expectColumnWithheld('pro', 'practitioner_profiles', 'rating', 5);
  });

  it('rating_count cannot be fabricated', async () => {
    await expectColumnWithheld('pro', 'practitioner_profiles', 'rating_count', 999);
  });

  it('jobs_done cannot be fabricated', async () => {
    await expectColumnWithheld('pro', 'practitioner_profiles', 'jobs_done', 9999);
  });

  it('slug cannot be hand-set (public URL squatting)', async () => {
    await expectColumnWithheld('pro', 'practitioner_profiles', 'slug', 'premium-slug-grab');
  });
});

describe('subscriptions: the paywall is not self-grantable', () => {
  it('status cannot be set to active', async () => {
    const { token, id } = ctx.pro;
    const { body: rows } = await rest(token, `/subscriptions?practitioner_id=eq.${id}&select=id,status`);
    if (!Array.isArray(rows) || !rows.length) return; // no subscription row to attack
    const sub = rows[0] as any;
    try {
      await rest(token, `/subscriptions?id=eq.${sub.id}`, 'PATCH', { status: 'active' });
      const { body: after } = await rest(token, `/subscriptions?id=eq.${sub.id}&select=status`);
      expect((after as any)[0].status, 'subscriptions.status was self-writable').toEqual(sub.status);
    } finally {
      const { body: now } = await rest(token, `/subscriptions?id=eq.${sub.id}&select=status`);
      if ((now as any)?.[0]?.status !== sub.status) {
        await rest(token, `/subscriptions?id=eq.${sub.id}`, 'PATCH', { status: sub.status });
      }
    }
  });
});

describe('the legitimate writes still work', () => {
  it('a user can still edit their own display name', async () => {
    const { token, id } = ctx.client;
    const before = await readColumn(token, 'profiles', id, 'first_name');
    await rest(token, `/profiles?id=eq.${id}`, 'PATCH', { first_name: 'DiagRenamed' });
    expect(await readColumn(token, 'profiles', id, 'first_name')).toEqual('DiagRenamed');
    await rest(token, `/profiles?id=eq.${id}`, 'PATCH', { first_name: before });
    expect(await readColumn(token, 'profiles', id, 'first_name')).toEqual(before);
  });

  it('a practitioner can still toggle is_online', async () => {
    const { token, id } = ctx.pro;
    const before = await readColumn(token, 'practitioner_profiles', id, 'is_online');
    await rest(token, `/practitioner_profiles?id=eq.${id}`, 'PATCH', { is_online: !before });
    expect(await readColumn(token, 'practitioner_profiles', id, 'is_online')).toEqual(!before);
    await rest(token, `/practitioner_profiles?id=eq.${id}`, 'PATCH', { is_online: before });
    expect(await readColumn(token, 'practitioner_profiles', id, 'is_online')).toEqual(before);
  });
});
