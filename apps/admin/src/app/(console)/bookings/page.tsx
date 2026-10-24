import Link from 'next/link';

import {
  BOOKING_MODE_LABEL,
  categoryLabel,
  formatWhen,
  formatZar,
  type Booking,
} from '@smomo/shared';

import { Tag } from '@/components/Tag';
import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Bookings' };

const FILTERS = [
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  confirmed: 'warn',
  in_progress: 'warn',
  completed: 'ok',
  cancelled: 'danger',
};

/**
 * The pro's confirmed work.
 *
 * This is the only place the client's street address appears, and only because the
 * booking exists: `accept_offer` copies it from the request once the client accepts, and
 * `bookings.bk_select_party` is what authorises reading it (migrations 16 and 17). Before
 * that point the pro sees the town and nothing more.
 *
 * RLS scopes the query to this practitioner's own rows, so there is no `.eq()` on
 * practitioner_id — adding one would imply the filter is what protects the data.
 */
export default async function Bookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status: raw } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.key === raw) ? (raw as Filter) : 'active';

  const supabase = await createClient();
  const base = supabase
    .from('bookings')
    .select('id, category, booking_mode, status, address, scheduled_at, final_price_zar, deposit_amount_zar, client_id, created_at, completed_at')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data, error } =
    filter === 'active'
      ? await base.in('status', ['confirmed', 'in_progress'])
      : filter === 'all'
        ? await base
        : await base.eq('status', filter);
  if (error) throw error;

  // The client is untyped (see lib/supabase/client.ts), so name the row shape rather than
  // indexing into `any`. `Booking` is the shared table row these columns come from.
  const rows = (data ?? []) as Pick<
    Booking,
    'id' | 'category' | 'booking_mode' | 'status' | 'address' | 'scheduled_at'
    | 'final_price_zar' | 'deposit_amount_zar' | 'client_id' | 'created_at' | 'completed_at'
  >[];
  const clientIds = [...new Set(rows.map((b) => b.client_id))];
  const { data: clients } = clientIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', clientIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.full_name]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Bookings</h1>
        <p className="mt-1 text-sm text-text-muted">
          {user.isStaff && !user.isPractitioner
            ? 'Bookings you are party to.'
            : 'Work a client has confirmed with you. The address appears once a booking exists.'}
        </p>
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'active' ? '/bookings' : `/bookings?status=${f.key}`}
            className="btn-console"
            aria-current={filter === f.key ? 'page' : undefined}
            style={filter === f.key ? { borderColor: 'var(--color-text)' } : undefined}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="panel overflow-hidden">
        <div className="panel-head">
          <h2 className="panel-title">
            {FILTERS.find((f) => f.key === filter)?.label}
            <span className="ml-2 font-normal tnum text-text-muted">{rows.length}</span>
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="panel-body text-sm text-text-muted">
            {filter === 'active' ? 'No active bookings.' : 'Nothing with this status.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Client</th>
                  <th scope="col">Service</th>
                  <th scope="col">Where</th>
                  <th scope="col">When</th>
                  <th scope="col">Price</th>
                  <th scope="col">Deposit</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td className="font-medium">{nameById.get(b.client_id) ?? '—'}</td>
                    <td>
                      {categoryLabel(b.category)}
                      <span className="mt-0.5 block text-xs text-text-muted">
                        {BOOKING_MODE_LABEL[b.booking_mode]}
                      </span>
                    </td>
                    <td className="max-w-[20rem]">
                      <span className="block truncate" title={b.address ?? undefined}>
                        {b.address || '—'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">{formatWhen(b.scheduled_at)}</td>
                    <td className="whitespace-nowrap font-medium tnum">{formatZar(b.final_price_zar)}</td>
                    <td className="whitespace-nowrap tnum text-text-muted">
                      {b.deposit_amount_zar != null ? formatZar(b.deposit_amount_zar) : '—'}
                    </td>
                    <td>
                      <Tag tone={STATUS_TONE[b.status] ?? 'neutral'}>{b.status.replace('_', ' ')}</Tag>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
