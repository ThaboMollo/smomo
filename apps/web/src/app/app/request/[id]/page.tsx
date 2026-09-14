'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';

import { categoryEmoji, categoryLabel, formatBudget, formatWhen, formatZar, timeLeft } from '@smomo/shared';

import { Avatar, Badge, Card, Stars } from '@/components/ui';
import { api } from '@/lib/api';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => api.requests.get(id),
    refetchInterval: 8000,
  });

  const accept = useMutation({
    mutationFn: (offerId: string) => api.offers.accept(offerId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['my-bookings'] });
      router.push(`/app/booking/${res.bookingId}`);
    },
  });

  if (isLoading) return <p className="text-text-muted">Loading…</p>;
  const request = data?.request;
  if (!request) return <p className="text-text-muted">Request not found.</p>;
  const isOpen = request.status === 'open';

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">
            {categoryEmoji(request.category)} {categoryLabel(request.category)}
          </h1>
          <Badge tone={isOpen ? 'primary' : 'default'}>
            {isOpen ? timeLeft(request.expires_at) : request.status}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-text-muted">{formatWhen(request.scheduled_at)}</p>
        {request.description ? <p className="mt-3">{request.description}</p> : null}
        {formatBudget(request.budget_min, request.budget_max) ? (
          <p className="mt-3 text-sm text-text-muted">
            Your budget: {formatBudget(request.budget_min, request.budget_max)}
          </p>
        ) : null}
      </Card>

      <h2 className="mt-8 text-lg font-bold">
        Offers {data?.offers.length ? `(${data.offers.length})` : ''}
      </h2>
      {isOpen && data?.offers.length === 0 ? (
        <p className="mt-2 text-text-muted">Waiting for offers — pros are being notified.</p>
      ) : null}

      <div className="mt-4 space-y-3">
        {data?.offers.map((o) => (
          <Card key={o.id}>
            <div className="flex items-start gap-4">
              <Avatar name={o.practitioner?.business_name ?? o.provider?.full_name ?? null} size={48} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {o.practitioner?.business_name ?? o.provider?.full_name ?? 'Pro'}
                  </span>
                  {o.practitioner?.verification_status === 'verified' ? (
                    <Badge tone="success">Verified</Badge>
                  ) : null}
                </div>
                <Stars rating={o.practitioner?.rating ?? null} count={o.practitioner?.rating_count ?? 0} />
                {o.message ? <p className="mt-1 text-sm text-text-muted">“{o.message}”</p> : null}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-bold text-primary">{formatZar(o.offered_price_zar)}</span>
              {isOpen && o.status === 'pending' ? (
                <button
                  onClick={() => accept.mutate(o.id)}
                  disabled={accept.isPending}
                  className="rounded-xl bg-primary px-5 py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
                >
                  Accept
                </button>
              ) : (
                <Badge tone={o.status === 'accepted' ? 'success' : 'default'}>{o.status}</Badge>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
