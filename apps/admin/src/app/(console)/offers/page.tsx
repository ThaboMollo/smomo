import Link from 'next/link';

import {
  BOOKING_MODE_LABEL,
  categoryLabel,
  formatBudget,
  formatTimeAgo,
  formatWhen,
  formatWhereAway,
  formatZar,
  joinMeta,
  timeLeft,
  type FeedRequest,
} from '@smomo/shared';

import { DecisionButtons } from '@/components/DecisionButtons';
import { SendOfferForm } from '@/components/SendOfferForm';
import { Tag } from '@/components/Tag';
import { withdrawOffer } from '@/app/(console)/offers/actions';
import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Offers' };

const OFFER_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  pending: 'warn',
  accepted: 'ok',
  rejected: 'danger',
  withdrawn: 'neutral',
};

/**
 * Open requests the pro can bid on, and the offers they have already sent.
 *
 * The feed comes from `feed_requests_for_practitioner`, which decides eligibility in the
 * database — verified, subscribed, online, category matches, and within range (or in the
 * same city when geolocation is parked). An empty feed is therefore not necessarily "no
 * work": it can mean the account is not verified or is offline, so the page says which.
 *
 * It returns the client's **city**, never their street address (migration 16). The address
 * arrives with the booking, once the client accepts.
 */
export default async function Offers() {
  const user = await requireUser();
  if (!user.isPractitioner) {
    return (
      <div className="panel">
        <div className="panel-body text-sm text-text-muted">
          <p className="font-medium text-text">This section is for professionals.</p>
          <p className="mt-1">Set up a studio in the SMOMO app to start receiving requests.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  const [{ data: feed, error: feedError }, { data: mine }, { data: me }] = await Promise.all([
    supabase.rpc('feed_requests_for_practitioner', { p_studio_radius_km: 50 }),
    supabase
      .from('request_offers')
      .select('id, request_id, offered_price_zar, message, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('practitioner_profiles')
      .select('is_online, verification_status')
      .eq('id', user.id)
      .maybeSingle(),
  ]);
  if (feedError) throw feedError;

  // The client is not parameterised with `<Database>` (see lib/supabase/client.ts), so an
  // RPC result arrives as `any`. `FeedRequest` is the shared shape of this RPC's rows and
  // is what every other app already uses for it — name it here rather than reading `any`.
  const requests = (feed ?? []) as FeedRequest[];
  const offers = mine ?? [];

  // Why the feed might be empty, in the order the pro can act on.
  const blockers: string[] = [];
  if (me?.verification_status !== 'verified') blockers.push('your account is not verified yet');
  if (me && !me.is_online) blockers.push('you are marked offline');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Offers</h1>
        <p className="mt-1 text-sm text-text-muted">
          Requests you can bid on, and what you have sent. Clients see your price and
          message, then choose.
        </p>
      </div>

      <section aria-labelledby="open-requests" className="space-y-3">
        <h2 id="open-requests" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
          Open requests
        </h2>

        {requests.length === 0 ? (
          <div className="panel">
            <div className="panel-body text-sm text-text-muted">
              {blockers.length ? (
                <>
                  <p className="font-medium text-text">No requests, because {blockers.join(' and ')}.</p>
                  <p className="mt-1">
                    {me?.verification_status !== 'verified'
                      ? 'Verification is done by the SMOMO team — you will see requests as soon as it is approved.'
                      : 'Go online from My studio to start receiving requests.'}
                  </p>
                </>
              ) : (
                <p>Nothing open that matches your categories and area right now.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.request_id} className="panel">
                <div className="panel-body flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{categoryLabel(r.category)}</span>
                      <Tag tone="warn">{timeLeft(r.expires_at)}</Tag>
                      {r.has_offered ? <Tag tone="ok">offer sent</Tag> : null}
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      {joinMeta(
                        BOOKING_MODE_LABEL[r.booking_mode],
                        formatWhereAway(r.distance_km, r.city),
                        formatWhen(r.scheduled_at),
                      )}
                    </p>
                    {r.description ? <p className="mt-2 text-sm">{r.description}</p> : null}
                    <p className="mt-2 text-xs text-text-muted">
                      {r.client_name ?? 'Client'}
                      {formatBudget(r.budget_min, r.budget_max)
                        ? ` · budget ${formatBudget(r.budget_min, r.budget_max)}`
                        : ''}
                    </p>
                  </div>
                  {!r.has_offered ? (
                    <SendOfferForm requestId={r.request_id} suggested={r.budget_max ?? r.budget_min ?? null} />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="my-offers" className="space-y-3">
        <h2 id="my-offers" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
          Your offers
        </h2>
        <div className="panel overflow-hidden">
          {offers.length === 0 ? (
            <div className="panel-body text-sm text-text-muted">You have not sent any offers yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Price</th>
                    <th scope="col">Message</th>
                    <th scope="col">Sent</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => (
                    <tr key={o.id}>
                      <td className="whitespace-nowrap font-medium tnum">{formatZar(o.offered_price_zar)}</td>
                      <td className="max-w-[24rem]">
                        <span className="block truncate" title={o.message ?? undefined}>
                          {o.message || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-text-muted">{formatTimeAgo(o.created_at)}</td>
                      <td>
                        <Tag tone={OFFER_TONE[o.status] ?? 'neutral'}>{o.status}</Tag>
                      </td>
                      <td>
                        {o.status === 'pending' ? (
                          <div className="flex justify-end">
                            <DecisionButtons
                              id={o.id}
                              action={withdrawOffer}
                              choices={[{ label: 'Withdraw', fields: {} }]}
                            />
                          </div>
                        ) : o.status === 'accepted' ? (
                          <div className="text-right">
                            <Link href="/bookings" className="btn-console">View booking</Link>
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
