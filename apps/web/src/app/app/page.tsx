'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';

import { categoryLabel, formatBudget, formatWhen, formatZar, timeLeft } from '@smomo/shared';

import { ArrowUpRight, Badge, EmptyState, Kicker, Skeleton, Sparkle } from '@/components/ui';
import { api } from '@/lib/api';
import { categoryImage } from '@/lib/catalog';
import { useMe } from '@/lib/use-me';

const REQ_TONE: Record<string, 'default' | 'primary' | 'success'> = {
  open: 'primary',
  matched: 'success',
  expired: 'default',
  cancelled: 'default',
};

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function Dashboard() {
  const me = useMe();
  const requests = useQuery({ queryKey: ['my-requests'], queryFn: () => api.requests.mine() });
  const bookings = useQuery({ queryKey: ['my-bookings'], queryFn: () => api.bookings.mine('client') });

  const firstName = me.data?.profile?.first_name ?? me.data?.profile?.full_name?.split(' ')[0] ?? null;
  const openRequests = (requests.data ?? []).filter((r) => r.status === 'open');
  const activeBookings = (bookings.data ?? []).filter((b) => b.status !== 'completed' && b.status !== 'cancelled');

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting + primary actions */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-8 rounded-[32px] bg-primary-950 p-7 text-white sm:p-10 lg:col-span-8">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-accent">
              ● {greeting().toUpperCase()}
            </p>
            <h1 className="mt-4 text-5xl sm:text-6xl">{firstName ? `Hi ${firstName}.` : 'Welcome back.'}</h1>
            <p className="mt-3 max-w-md text-primary-300">
              {openRequests.length > 0
                ? `You have ${openRequests.length} open request${openRequests.length > 1 ? 's' : ''}. Offers show up here as pros respond.`
                : activeBookings.length > 0
                  ? `You have ${activeBookings.length} upcoming booking${activeBookings.length > 1 ? 's' : ''}.`
                  : 'What are we booking today?'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/app/request/new" className="btn btn-light">
              Post a request
            </Link>
            <Link href="/app/discover" className="btn border border-primary-400 text-white hover:bg-primary-900">
              Browse pros near me
            </Link>
          </div>
        </div>
        <Link
          href="/app/discover"
          className="group relative hidden min-h-[280px] overflow-hidden rounded-[32px] lg:col-span-4 lg:block"
        >
          <Image src="/editorial/look-nails-chrome.webp" alt="" fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          <span className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-[20px] bg-card p-4 text-text">
            <span>
              <span className="block font-medium">Pros online near you</span>
              <span className="block text-sm text-text-muted">See who can take you today</span>
            </span>
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
              <ArrowUpRight size={16} />
            </span>
          </span>
        </Link>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Requests */}
        <section className="rounded-[32px] bg-card p-6 sm:p-8" aria-labelledby="reqs">
          <div className="flex items-center justify-between">
            <div>
              <Kicker>Requests</Kicker>
              <h2 id="reqs" className="mt-2 text-3xl">Your requests</h2>
            </div>
            <Link href="/app/request/new" className="btn btn-outline">
              New
            </Link>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            {requests.isLoading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (requests.data ?? []).length === 0 ? (
              <EmptyState
                title="No requests yet"
                body="Tell pros what you need. Those nearby are notified and send you offers."
                action={
                  <Link href="/app/request/new" className="btn btn-primary">
                    Post your first request
                  </Link>
                }
              />
            ) : (
              (requests.data ?? []).map((r) => (
                <Link
                  key={r.id}
                  href={`/app/request/${r.id}`}
                  className="flex items-center gap-4 rounded-[20px] border border-border p-3 transition-colors hover:border-primary-300 hover:bg-primary-100"
                >
                  <Image src={categoryImage(r.category)} alt="" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{categoryLabel(r.category)}</div>
                    <div className="truncate text-sm text-text-muted">
                      {formatWhen(r.scheduled_at)}
                      {formatBudget(r.budget_min, r.budget_max) ? ` · ${formatBudget(r.budget_min, r.budget_max)}` : ''}
                    </div>
                  </div>
                  <Badge tone={REQ_TONE[r.status]}>{r.status === 'open' ? timeLeft(r.expires_at) : r.status}</Badge>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Bookings */}
        <section className="rounded-[32px] bg-card p-6 sm:p-8" aria-labelledby="bks">
          <Kicker>Bookings</Kicker>
          <h2 id="bks" className="mt-2 text-3xl">Your bookings</h2>
          <div className="mt-5 flex flex-col gap-2">
            {bookings.isLoading ? (
              <>
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </>
            ) : (bookings.data ?? []).length === 0 ? (
              <EmptyState
                title="No bookings yet"
                body="When you accept an offer, your booking and chat with the pro appear here."
              />
            ) : (
              (bookings.data ?? []).map((b) => (
                <Link
                  key={b.id}
                  href={`/app/booking/${b.id}`}
                  className="flex items-center gap-4 rounded-[20px] border border-border p-3 transition-colors hover:border-primary-300 hover:bg-primary-100"
                >
                  <Image src={categoryImage(b.category)} alt="" width={56} height={56} className="h-14 w-14 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{b.practitioner?.full_name ?? 'Provider'}</div>
                    <div className="truncate text-sm text-text-muted">
                      {categoryLabel(b.category)} · <span className="tnum">{formatZar(b.final_price_zar)}</span> ·{' '}
                      {formatWhen(b.scheduled_at)}
                    </div>
                  </div>
                  <Badge tone={b.status === 'completed' ? 'success' : 'primary'}>{b.status.replace(/_/g, ' ')}</Badge>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      {!me.data?.profile?.is_practitioner && me.data ? (
        <Link
          href="/app/studio"
          className="flex flex-col items-start justify-between gap-4 rounded-[32px] bg-primary p-7 text-white transition-colors hover:bg-primary-dark sm:flex-row sm:items-center sm:p-8"
        >
          <span className="flex items-center gap-4">
            <Sparkle size={28} />
            <span>
              <span className="block font-[family-name:var(--font-heading)] text-3xl">Do beauty or body art?</span>
              <span className="block text-primary-100">Set up your studio and start getting requests.</span>
            </span>
          </span>
          <span className="btn btn-light">Become a provider</span>
        </Link>
      ) : null}
    </div>
  );
}
