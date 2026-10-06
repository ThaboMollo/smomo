'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

import { CATEGORIES, type BookingMode, type ServiceCategory } from '@smomo/shared';

import { DiscoverProviderCard } from '@/components/DiscoverProviderCard';
import { EmptyState, Skeleton } from '@/components/ui';
import { api } from '@/lib/api';
import { categoryImage } from '@/lib/catalog';
import { useCoords } from '@/lib/use-coords';

const MODES: { value: 'all' | BookingMode; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'mobile', label: 'They come to me' },
  { value: 'studio', label: 'At their studio' },
];

export default function Discover() {
  const { coords, ready, source } = useCoords();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [mode, setMode] = useState<'all' | BookingMode>('all');

  const providers = useQuery({
    queryKey: ['discover', coords, category, mode],
    enabled: ready,
    queryFn: () =>
      api.providers.search({
        lat: coords.latitude,
        lng: coords.longitude,
        category: category ?? undefined,
        mode: mode === 'all' ? undefined : mode,
        maxKm: 50,
      }),
  });

  const list = providers.data ?? [];
  const online = list.filter((p) => p.is_online).length;
  const requestHref = category ? `/app/request/new?category=${category}` : '/app/request/new';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div>
        <p className="text-sm text-text-muted">
          {!ready ? 'Finding your location…' : source === 'device' ? 'Within 50 km of you' : 'Location is off, showing pros near Cape Town'}
        </p>
        <h1 className="text-5xl">Discover</h1>
      </div>

      {/* Broadcast CTA */}
      <Link
        href={requestHref}
        className="group flex items-center gap-4 rounded-[24px] bg-primary-950 p-4 text-white transition-colors hover:bg-primary-900 sm:p-5"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="flex-1">
          <span className="block text-lg font-medium">Post a request</span>
          <span className="block text-sm text-primary-300">Tell pros what you need. They send you offers.</span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-primary-300 transition-transform group-hover:translate-x-1" aria-hidden>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </Link>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Service">
          <button type="button" onClick={() => setCategory(null)} aria-pressed={category === null} className="chip">
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory((prev) => (prev === c.value ? null : c.value))}
              aria-pressed={category === c.value}
              className="chip pl-1.5"
            >
              <Image src={categoryImage(c.value)} alt="" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
              {c.label}
            </button>
          ))}
        </div>

        <div role="radiogroup" aria-label="Where" className="segmented">
          {MODES.map((m) => (
            <button key={m.value} type="button" role="radio" aria-checked={mode === m.value} onClick={() => setMode(m.value)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <section aria-live="polite" className="flex flex-col gap-3">
        {!ready || providers.isLoading ? (
          <>
            <p className="text-sm text-text-muted">Finding pros near you…</p>
            <Skeleton className="h-[116px]" />
            <Skeleton className="h-[116px]" />
            <Skeleton className="h-[116px]" />
          </>
        ) : providers.isError ? (
          <EmptyState
            title="We couldn't load pros right now"
            body="Check your connection and try again."
            action={
              <button type="button" onClick={() => providers.refetch()} className="btn btn-outline">
                Try again
              </button>
            }
          />
        ) : list.length > 0 ? (
          <>
            <div className="flex items-baseline justify-between">
              <span className="font-medium">
                {list.length} pro{list.length === 1 ? '' : 's'} nearby
                {online > 0 ? <span className="text-text-muted"> · {online} online now</span> : null}
              </span>
            </div>
            {list.map((p) => (
              <DiscoverProviderCard key={p.id} p={p} />
            ))}
          </>
        ) : (
          <EmptyState
            title="No pros nearby for this filter"
            body="Try another service, or post a request and pros will come to you."
            action={
              <Link href={requestHref} className="btn btn-primary">
                Post a request
              </Link>
            }
          />
        )}
      </section>
    </div>
  );
}
