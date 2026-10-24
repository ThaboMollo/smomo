/**
 * Guard for spec RC-2 / Phase 3 — the RPC parameter contract.
 *
 * PostgREST resolves an RPC overload by the *exact set of argument names* in the body,
 * and supabase-js omits any key whose value is `undefined`. So a zod-optional field that
 * maps to a SQL argument with no DB default makes the whole call unresolvable: PostgREST
 * answers PGRST202 and the client sees a 500.
 *
 * That is not hypothetical — it shipped. `save_business_profile` declared `p_bio` and
 * `p_years_experience` with no default while the API passed them as `?? undefined`, so
 * saving a studio profile without a bio or a years-experience value 500'd in production:
 *
 *   Could not find the function public.save_business_profile(p_bio, p_business_name,
 *   p_categories, p_deposit_percentage, p_requires_deposit, p_service_mode,
 *   p_travel_radius_km) in the schema cache
 *
 * These specs send the MINIMAL body — every optional argument left out — and assert the
 * call resolves. They go straight at PostgREST rather than through the API because the
 * resolution happens there; a passing API call would only prove the API currently fills
 * in every key, not that the signature tolerates a missing one.
 *
 * Non-destructive by construction: each payload is one the function rejects in its own
 * first guard (empty categories, a nonexistent id), so resolution is exercised and no row
 * is ever written. Assert on the error CODE, never on success — P0001/P0002 means "the
 * function ran and refused", which is the proof we want. PGRST202 is the failure.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { ACCOUNTS, login, rest } from '../helpers/supa';

const NOT_FOUND = 'PGRST202';
const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

let token = '';
let available = false;

beforeAll(async () => {
  try {
    token = await login(ACCOUNTS.pro);
    available = true;
  } catch {
    // No reachable project or the diag account is gone — same convention as the other specs.
    available = false;
  }
}, 30_000);

/**
 * Call `fn` with the minimal body and assert PostgREST found an overload for it.
 * `body` must be one the function itself rejects, so nothing is persisted.
 */
async function expectResolvable(fn: string, body: Record<string, unknown>) {
  const { status, body: res } = await rest(token, `/rpc/${fn}`, 'POST', body);
  const code = (res as { code?: string } | null)?.code;
  expect(
    code,
    `${fn} did not resolve with the minimal argument set — every nullable argument needs a ` +
      `DB default. PostgREST said: ${JSON.stringify(res)}`,
  ).not.toBe(NOT_FOUND);
  // A resolved call must have reached the body and been refused there, not 2xx'd.
  expect([400, 404, 409], `${fn} returned ${status}: ${JSON.stringify(res)}`).toContain(status);
}

describe('RPC argument sets resolve with every optional argument omitted', () => {
  it('save_business_profile', async () => {
    if (!available) return;
    // Empty p_categories is refused by the function's second guard, before any write.
    await expectResolvable('save_business_profile', {
      p_business_name: 'contract probe',
      p_categories: [],
      p_service_mode: 'studio',
      p_travel_radius_km: 1,
      p_requires_deposit: false,
    });
  }, 20_000);

  it('make_offer', async () => {
    if (!available) return;
    // A nonexistent request id is refused before any write.
    await expectResolvable('make_offer', { p_request_id: ZERO_UUID, p_price: 1 });
  }, 20_000);

  it('complete_booking', async () => {
    if (!available) return;
    await expectResolvable('complete_booking', {
      p_booking_id: ZERO_UUID,
      p_rating: 5,
      p_proof_image_url: 'https://example.com/p.jpg',
    });
  }, 20_000);

  /**
   * Not covered here: `create_request`. Its first statement is the INSERT — it has no
   * guard to refuse a probe on — so there is no payload that exercises resolution without
   * writing a real booking request. Its signature is safe by inspection (9 of 13 arguments
   * carry defaults and the API always sends the 4 required ones); if that ever changes,
   * assert it against `pg_proc` rather than by calling it.
   */
});
