import { formatDateShort, formatZar, type Payment } from '@smomo/shared';

import { Tag } from '@/components/Tag';
import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Earnings' };

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  verified: 'ok',
  pending: 'warn',
  disputed: 'danger',
  rejected: 'danger',
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel">
      <div className="stat">
        <p className="stat-label">{label}</p>
        <p className="stat-value tnum">{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-text-muted">{sub}</p> : null}
      </div>
    </div>
  );
}

/**
 * What the pro has been paid, and what is still owed.
 *
 * Clients pay pros **directly** by PayShap — SMOMO never holds the money — so these are
 * records of payments the two sides have agreed about, not a balance SMOMO owes. That
 * distinction drives the wording: "verified" means the pro confirmed the money arrived,
 * "awaiting" means the client says they have paid and the pro has not confirmed yet.
 *
 * RLS scopes `payments` to rows where the caller is payer or payee, so this is the pro's
 * own money without a filter.
 */
export default async function Earnings() {
  const user = await requireUser();
  if (!user.isPractitioner) {
    return (
      <div className="panel">
        <div className="panel-body text-sm text-text-muted">
          <p className="font-medium text-text">This section is for professionals.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payments')
    .select('id, booking_id, amount_zar, payment_type, status, payshap_reference, marked_paid_at, verified_at, created_at, payee_id')
    .eq('payee_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  const rows = (data ?? []) as Pick<
    Payment,
    'id' | 'booking_id' | 'amount_zar' | 'payment_type' | 'status' | 'payshap_reference'
    | 'marked_paid_at' | 'verified_at' | 'created_at'
  >[];

  const sum = (f: (p: (typeof rows)[number]) => boolean) =>
    rows.filter(f).reduce((s, p) => s + Number(p.amount_zar ?? 0), 0);

  const received = sum((p) => p.status === 'verified');
  const awaiting = sum((p) => p.status === 'pending');
  const disputed = sum((p) => p.status === 'disputed');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Earnings</h1>
        <p className="mt-1 text-sm text-text-muted">
          Clients pay you directly by PayShap. SMOMO records the payments but never holds
          the money.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Received" value={formatZar(received)} sub="You confirmed it arrived" />
        <Stat label="Awaiting your confirmation" value={formatZar(awaiting)} sub="Client marked as paid" />
        <Stat label="In dispute" value={formatZar(disputed)} sub="SMOMO is reviewing" />
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-head">
          <h2 className="panel-title">
            Payments
            <span className="ml-2 font-normal tnum text-text-muted">{rows.length}</span>
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="panel-body text-sm text-text-muted">
            No payments yet. They appear once a client confirms a booking with you.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Amount</th>
                  <th scope="col">Type</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Client marked paid</th>
                  <th scope="col">You confirmed</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="whitespace-nowrap font-medium tnum">{formatZar(p.amount_zar)}</td>
                    <td><Tag>{p.payment_type}</Tag></td>
                    <td className="tnum">{p.payshap_reference || '—'}</td>
                    <td className="whitespace-nowrap text-text-muted">
                      {p.marked_paid_at ? formatDateShort(p.marked_paid_at) : '—'}
                    </td>
                    <td className="whitespace-nowrap text-text-muted">
                      {p.verified_at ? formatDateShort(p.verified_at) : '—'}
                    </td>
                    <td><Tag tone={STATUS_TONE[p.status] ?? 'neutral'}>{p.status}</Tag></td>
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
