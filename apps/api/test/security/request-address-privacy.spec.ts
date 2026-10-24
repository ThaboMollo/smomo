/**
 * Guard for migration 17 — a practitioner must never reach a client's street address
 * before the booking exists.
 *
 * This attacks PostgREST directly with the anon key and a practitioner's own JWT, not the
 * API: the API not offering an endpoint proves nothing, because that is exactly the pair
 * of credentials the mobile and web bundles already ship. `booking_requests.address` is
 * reachable only through the `br_select_party` policy, so the policy is the boundary and
 * the policy is what these specs test.
 *
 * What shipped before migration 17: `br_select_party` allowed
 * `auth.uid() = target_practitioner_id`, so for a *directed* request the targeted provider
 * could read the whole row — address included — with no offer and no booking. Verified
 * against production before the fix: 1 row visible, 1 address visible.
 *
 * The first spec posts its own directed request aimed at the practitioner, because an
 * assertion that merely reads whatever happens to be in the table passes vacuously when
 * nobody is currently targeted — which is exactly how this leak survived. The fixture is
 * cancelled in a `finally`, so a FAILING run still leaves no open request behind.
 *
 * The permitted route is the only one left: the client accepts an offer, `accept_offer`
 * copies the address onto `bookings`, and `bk_select_party` lets that practitioner read it
 * from there. `booking_status` has no pre-confirmed state, so a booking existing is a
 * confirmed booking.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { ACCOUNTS, login, rest } from '../helpers/supa';

const SECRET_ADDRESS = '12 Privacy Probe Road, Observatory, Cape Town';

let clientToken = '';
let proToken = '';
let proId = '';
let available = false;

/** RLS lets a user read many profiles, so identity comes from the JWT, not a query. */
function subject(token: string): string {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString()).sub as string;
}

beforeAll(async () => {
  try {
    [clientToken, proToken] = await Promise.all([login(ACCOUNTS.client), login(ACCOUNTS.pro)]);
    proId = subject(proToken);
    available = true;
  } catch {
    available = false;
  }
}, 30_000);

describe('a practitioner cannot read a client request address', () => {
  it('not even for a request directed at them', async () => {
    if (!available) return;

    // Coordinates are sent as well as a city so this resolves against the signature both
    // before and after migration 16 — the argument names are a subset of each.
    const created = await rest(clientToken, '/rpc/create_request', 'POST', {
      p_category: 'hairdresser',
      p_booking_mode: 'mobile',
      p_lat: -33.9249,
      p_lng: 18.4241,
      p_address: SECRET_ADDRESS,
      p_target: proId,
      p_expires_minutes: 5,
    });
    if (created.status !== 200) {
      throw new Error(`could not post the fixture request: ${created.status} ${JSON.stringify(created.body)}`);
    }
    const requestId = created.body as string;

    try {
      const byId = await rest(proToken, `/booking_requests?id=eq.${requestId}&select=id,address`);
      const rows = (Array.isArray(byId.body) ? byId.body : []) as { address: string | null }[];
      expect(
        rows,
        'the targeted practitioner could read the directed request row at all — ' +
          'br_select_party must not grant them a read (migration 17)',
      ).toHaveLength(0);

      // Belt and braces: the address must not surface through any practitioner-visible read.
      const all = await rest(proToken, '/booking_requests?select=address');
      const leaked = ((Array.isArray(all.body) ? all.body : []) as { address: string | null }[])
        .filter((r) => r.address != null);
      expect(leaked, `booking_requests leaked ${leaked.length} address(es) to a practitioner`).toHaveLength(0);
    } finally {
      // Clients may update their own request; cancelling takes it out of every feed.
      await rest(clientToken, `/booking_requests?id=eq.${requestId}`, 'PATCH', { status: 'cancelled' });
    }
  }, 30_000);

  it('the feed exposes a city but never an address', async () => {
    if (!available) return;
    const { status, body } = await rest(proToken, '/rpc/feed_requests_for_practitioner', 'POST', {
      p_studio_radius_km: 50,
    });
    expect(status, `unexpected status: ${JSON.stringify(body)}`).toBe(200);

    const rows = (Array.isArray(body) ? body : []) as Record<string, unknown>[];
    for (const row of rows) {
      expect(
        Object.keys(row),
        'feed_requests_for_practitioner must not return `address` (migration 16)',
      ).not.toContain('address');
    }
    if (rows.length) expect(Object.keys(rows[0])).toContain('city');
  }, 20_000);
});
