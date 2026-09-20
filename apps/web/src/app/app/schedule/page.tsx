'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { categoryLabel, formatWhen, formatZar } from '@smomo/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Avatar, Badge, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

const TONE: Record<string, 'default' | 'primary' | 'success' | 'danger'> = {
  confirmed: 'primary',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

export default function Schedule() {
  const me = useMe();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const bookings = useQuery({
    queryKey: ['schedule'],
    queryFn: () => api.bookings.mine('practitioner'),
    enabled: !!me.data?.profile?.is_practitioner,
  });

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!me.data?.profile?.is_practitioner)
    return <p className="text-text-muted">Set up your studio first to see your schedule.</p>;

  const all = bookings.data ?? [];
  const filtered = all.filter((b) =>
    tab === 'upcoming'
      ? b.status === 'confirmed' || b.status === 'in_progress'
      : b.status === 'completed' || b.status === 'cancelled',
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl">Schedule</h1>

      <div className="flex gap-2">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded border px-3 py-2 text-sm font-medium capitalize ${tab === t ? 'border-primary bg-primary-100 text-primary-700' : 'border-border bg-card'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((b) => (
          <Link key={b.id} href={`/app/booking/${b.id}`}>
            <Card className="flex items-center gap-4 transition-colors hover:bg-primary-100">
              <Avatar name={b.client?.full_name ?? null} size={44} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{b.client?.full_name ?? 'Client'}</span>
                  <Badge tone={TONE[b.status]}>{b.status.replace('_', ' ')}</Badge>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-text-muted">
                  <CategoryIcon category={b.category} size={14} />
                  {categoryLabel(b.category)} · {formatZar(b.final_price_zar)}
                </p>
                <p className="text-xs text-text-faint">{formatWhen(b.scheduled_at)}</p>
              </div>
            </Card>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <p className="text-text-muted">
            {tab === 'upcoming' ? 'No upcoming jobs. Accepted bookings show up here.' : 'No past jobs yet.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
