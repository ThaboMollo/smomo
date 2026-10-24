'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  BOOKING_MODE_LABEL,
  categoryLabel,
  formatBudget,
  formatWhen,
  formatWhereAway,
  joinMeta,
  timeLeft,
} from '@smomo/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Badge, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

export default function Feed() {
  const me = useMe();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const online = !!me.data?.practitioner?.is_online;
  const verified = me.data?.practitioner?.verification_status === 'verified';

  const feed = useQuery({
    queryKey: ['feed'],
    queryFn: () => api.feed.list(),
    enabled: online,
    refetchInterval: online ? 10000 : false,
  });

  const makeOffer = useMutation({
    mutationFn: (requestId: string) =>
      api.offers.make({ requestId, price: Number(price), message: message.trim() || undefined }),
    onSuccess: () => {
      setOpenId(null);
      setPrice('');
      setMessage('');
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!me.data?.profile?.is_practitioner)
    return <p className="text-text-muted">Set up your studio first.</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-4xl sm:text-5xl">Client requests</h1>
      {!verified ? (
        <Card className="mt-4 border-primary-300 bg-primary-100">You can appear in search, but you must be verified to accept bookings.</Card>
      ) : null}
      {!online ? (
        <Card className="mt-4">You're offline. Go online from your Studio to receive requests.</Card>
      ) : (
        <div className="mt-6 space-y-3">
          {(feed.data ?? []).map((r) => (
            <Card key={r.request_id}>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <CategoryIcon category={r.category} size={16} />
                  {categoryLabel(r.category)}
                </span>
                <Badge tone="primary">{timeLeft(r.expires_at)}</Badge>
              </div>
              {/* `formatWhereAway` gives the distance when we have one and the town when we
                  don't, and `joinMeta` drops the separator rather than leaving "· away"
                  behind. The street address is not here on purpose — the practitioner gets
                  it from the booking once the client accepts (migration 16). */}
              <p className="mt-1 text-sm text-text-muted">
                {joinMeta(
                  BOOKING_MODE_LABEL[r.booking_mode],
                  formatWhereAway(r.distance_km, r.city),
                  formatWhen(r.scheduled_at),
                )}
              </p>
              {r.description ? <p className="mt-2">{r.description}</p> : null}
              <div className="mt-2 flex items-center justify-between text-sm text-text-muted">
                <span>{r.client_name ?? 'Client'}</span>
                {formatBudget(r.budget_min, r.budget_max) ? <span>Budget {formatBudget(r.budget_min, r.budget_max)}</span> : null}
              </div>

              {r.has_offered ? (
                <Badge tone="success">Offer sent</Badge>
              ) : openId === r.request_id ? (
                <div className="mt-3 space-y-2">
                  <input placeholder="Your price (R)" inputMode="numeric" className="input w-full" value={price} onChange={(e) => setPrice(e.target.value)} />
                  <input placeholder="Message (optional)" className="input w-full" value={message} onChange={(e) => setMessage(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={() => makeOffer.mutate(r.request_id)} disabled={!price || makeOffer.isPending} className="btn btn-primary">
                      Send offer
                    </button>
                    <button onClick={() => setOpenId(null)} className="btn btn-outline">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setOpenId(r.request_id)} className="btn btn-primary mt-3">
                  Make an offer
                </button>
              )}
            </Card>
          ))}
          {feed.data && feed.data.length === 0 ? (
            <p className="text-text-muted">No open requests right now. New ones appear here in real time.</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
