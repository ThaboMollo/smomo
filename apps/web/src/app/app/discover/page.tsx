'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { CATEGORIES, type BookingMode, type ServiceCategory } from '@smomo/shared';

import { DiscoverProviderCard } from '@/components/DiscoverProviderCard';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useCoords } from '@/lib/use-coords';

const MODES: { value: 'all' | BookingMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mobile', label: 'They come to me' },
  { value: 'studio', label: 'At their studio' },
];

export default function Discover() {
  const { coords, ready } = useCoords();
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-text-muted">Find beauty &amp; body-service pros around you.</p>
      </div>

      {/* Broadcast CTA */}
      <Link href="/app/request/new">
        <Card className="flex items-center justify-between bg-primary text-white transition-shadow hover:shadow-md">
          <div>
            <p className="text-lg font-bold">Post a request</p>
            <p className="text-sm text-white/90">Tell pros what you need — they&apos;ll send you offers.</p>
          </div>
          <span className="text-2xl">📣</span>
        </Card>
      </Link>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(null)}
          className={`rounded-full border px-4 py-2 text-sm font-medium ${category === null ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory((prev) => (prev === c.value ? null : c.value))}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${category === c.value ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Mode segmented */}
      <div className="flex gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${mode === m.value ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {!ready || providers.isLoading ? (
          <p className="text-text-muted">Finding providers near you…</p>
        ) : providers.data && providers.data.length > 0 ? (
          providers.data.map((p) => <DiscoverProviderCard key={p.id} p={p} />)
        ) : (
          <Card className="text-center">
            <p className="font-semibold">No providers online nearby</p>
            <p className="mt-1 text-sm text-text-muted">
              Try a different category, or{' '}
              <Link href="/app/request/new" className="font-semibold text-primary">
                post a request
              </Link>{' '}
              — pros will come to you.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
