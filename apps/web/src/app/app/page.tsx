'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { categoryEmoji, categoryLabel, formatBudget, formatWhen, formatZar } from '@smomo/shared';

import { Badge, Button, Card } from '@/components/ui';
import { api } from '@/lib/api';

const REQ_TONE: Record<string, 'default' | 'primary' | 'success'> = {
  open: 'primary',
  matched: 'success',
  expired: 'default',
  cancelled: 'default',
};

export default function Dashboard() {
  const requests = useQuery({ queryKey: ['my-requests'], queryFn: () => api.requests.mine() });
  const bookings = useQuery({ queryKey: ['my-bookings'], queryFn: () => api.bookings.mine('client') });

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your dashboard</h1>
        <Button href="/app/request/new">Post a request</Button>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold">Your requests</h2>
        <div className="grid gap-3">
          {(requests.data ?? []).map((r) => (
            <Link key={r.id} href={`/app/request/${r.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="font-semibold">
                    {categoryEmoji(r.category)} {categoryLabel(r.category)}
                  </div>
                  <div className="text-sm text-text-muted">
                    {formatWhen(r.scheduled_at)}
                    {formatBudget(r.budget_min, r.budget_max) ? ` · ${formatBudget(r.budget_min, r.budget_max)}` : ''}
                  </div>
                </div>
                <Badge tone={REQ_TONE[r.status]}>{r.status}</Badge>
              </Card>
            </Link>
          ))}
          {requests.data && requests.data.length === 0 ? (
            <p className="text-text-muted">No requests yet. Post one to get offers from nearby pros.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">Your bookings</h2>
        <div className="grid gap-3">
          {(bookings.data ?? []).map((b) => (
            <Link key={b.id} href={`/app/booking/${b.id}`}>
              <Card className="flex items-center justify-between transition-shadow hover:shadow-md">
                <div>
                  <div className="font-semibold">{b.practitioner?.full_name ?? 'Provider'}</div>
                  <div className="text-sm text-text-muted">
                    {categoryEmoji(b.category)} {categoryLabel(b.category)} · {formatZar(b.final_price_zar)}
                  </div>
                </div>
                <Badge tone={b.status === 'completed' ? 'success' : 'primary'}>
                  {b.status.replace('_', ' ')}
                </Badge>
              </Card>
            </Link>
          ))}
          {bookings.data && bookings.data.length === 0 ? (
            <p className="text-text-muted">No bookings yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
