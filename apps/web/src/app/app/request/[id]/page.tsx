'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { categoryLabel, formatBudget, formatWhen, formatZar, timeLeft } from '@smomo/shared';

import { Avatar, Badge, EmptyState, Skeleton, Stars } from '@/components/ui';
import { categoryImage } from '@/lib/catalog';
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

  const cancel = useMutation({
    mutationFn: () => api.requests.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['request', id] });
      qc.invalidateQueries({ queryKey: ['my-requests'] });
      router.push('/app');
    },
  });

  if (isLoading)
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-3">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  const request = data?.request;
  if (!request)
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState title="Request not found" action={<Link href="/app" className="btn btn-outline">Back to home</Link>} />
      </div>
    );
  const isOpen = request.status === 'open';
  const offers = data?.offers ?? [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <section className="overflow-hidden rounded-[32px] bg-primary-950 text-white">
        <div className="flex items-start gap-4 p-6 sm:p-8">
          <Image src={categoryImage(request.category)} alt="" width={72} height={72} className="h-[72px] w-[72px] rounded-2xl object-cover" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${isOpen ? 'bg-primary text-white' : 'bg-primary-900 text-primary-200'}`}>
                {isOpen ? `Open · ${timeLeft(request.expires_at)}` : request.status}
              </span>
            </div>
            <h1 className="mt-3 text-4xl">{categoryLabel(request.category)}</h1>
            <p className="mt-1 text-primary-300">
              {formatWhen(request.scheduled_at)}
              {formatBudget(request.budget_min, request.budget_max) ? ` · ${formatBudget(request.budget_min, request.budget_max)}` : ''}
            </p>
          </div>
        </div>
        {request.description ? (
          <p className="border-t border-primary-900 px-6 py-5 text-primary-100 sm:px-8">{request.description}</p>
        ) : null}
      </section>

      <section aria-live="polite">
        <div className="flex items-baseline justify-between">
          <h2 className="text-3xl">Offers</h2>
          <span className="tnum text-sm text-text-muted">{offers.length} received</span>
        </div>

        {isOpen && offers.length === 0 ? (
          <div className="mt-4 flex items-center gap-4 rounded-[24px] border border-dashed border-primary-300 bg-card p-6">
            <span className="relative flex h-4 w-4 shrink-0">
              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-primary" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-primary" />
            </span>
            <div>
              <p className="font-medium">Waiting for offers</p>
              <p className="text-sm text-text-muted">Pros nearby have been notified. This page updates on its own.</p>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3">
          {offers.map((o) => {
            const name = o.practitioner?.business_name ?? o.provider?.full_name ?? 'Pro';
            return (
              <div key={o.id} className="rounded-[24px] border border-border bg-card p-5">
                <div className="flex items-start gap-4">
                  <Avatar name={name} src={o.provider?.avatar_url} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{name}</span>
                      {o.practitioner?.verification_status === 'verified' ? <Badge tone="success">Verified</Badge> : null}
                    </div>
                    <Stars rating={o.practitioner?.rating ?? null} count={o.practitioner?.rating_count ?? 0} />
                    {o.message ? <p className="mt-2 text-text-muted">“{o.message}”</p> : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="tnum font-[family-name:var(--font-heading)] text-3xl text-primary-700">
                    {formatZar(o.offered_price_zar)}
                  </span>
                  <div className="flex gap-2">
                    {o.practitioner_id ? (
                      <Link href={`/app/provider/${o.practitioner_id}`} className="btn btn-outline">
                        Profile
                      </Link>
                    ) : null}
                    {isOpen && o.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => accept.mutate(o.id)}
                        disabled={accept.isPending}
                        className="btn btn-primary"
                      >
                        {accept.isPending && accept.variables === o.id ? 'Accepting…' : 'Accept offer'}
                      </button>
                    ) : (
                      <Badge tone={o.status === 'accepted' ? 'success' : 'default'}>{o.status}</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {isOpen ? (
        <button
          type="button"
          onClick={() => {
            if (confirm('Stop receiving offers for this request?')) cancel.mutate();
          }}
          disabled={cancel.isPending}
          className="btn btn-danger self-center"
        >
          {cancel.isPending ? 'Cancelling…' : 'Cancel request'}
        </button>
      ) : null}
    </div>
  );
}
