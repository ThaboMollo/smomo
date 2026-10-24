import { formatTimeAgo, formatZar } from '@smomo/shared';

import { DecisionButtons } from '@/components/DecisionButtons';
import { Tag } from '@/components/Tag';
import { resolveDispute } from '@/app/(console)/platform/actions';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Payment disputes' };

/**
 * Disputed payments.
 *
 * A client marks a payment paid and the pro verifies it; a disagreement lands here.
 * Resolving as `verified` means the money did arrive and the pro is credited; `rejected`
 * means it did not. Both go through `resolve_dispute`, which stamps `verified_by` from
 * `auth.uid()` in the database, so the decision has an author.
 *
 * There is no filter tab: a payment is only in this list while `status = 'disputed'`, and
 * deciding it removes it. The dispute reason the pro gave is shown, because it is the only
 * thing explaining why the row is here.
 */
export default async function Disputes() {
  const supabase = await createClient();

  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, booking_id, payer_id, payee_id, amount_zar, payment_type, payshap_reference, dispute_reason, marked_paid_at, created_at')
    .eq('status', 'disputed')
    .order('created_at', { ascending: false });
  if (error) throw error;

  const rows = payments ?? [];
  const people = [...new Set(rows.flatMap((p) => [p.payer_id, p.payee_id]))];
  const bookingIds = [...new Set(rows.map((p) => p.booking_id))];

  const [{ data: profiles }, { data: bookings }] = await Promise.all([
    people.length
      ? supabase.from('profiles').select('id, full_name').in('id', people)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    bookingIds.length
      ? supabase.from('bookings').select('id, category, final_price_zar, status, scheduled_at').in('id', bookingIds)
      : Promise.resolve({ data: [] as { id: string; category: string; final_price_zar: number; status: string; scheduled_at: string | null }[] }),
  ]);

  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  const bookingById = new Map((bookings ?? []).map((b) => [b.id, b]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Payment disputes</h1>
        <p className="mt-1 text-sm text-text-muted">
          Clients pay pros directly by PayShap. These are the payments the two sides
          disagree about.
        </p>
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-head">
          <h2 className="panel-title">
            Disputed
            <span className="ml-2 font-normal tnum text-text-muted">{rows.length}</span>
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="panel-body text-sm text-text-muted">No open disputes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Amount</th>
                  <th scope="col">Type</th>
                  <th scope="col">Client</th>
                  <th scope="col">Pro</th>
                  <th scope="col">Reference</th>
                  <th scope="col">Reason given</th>
                  <th scope="col">Raised</th>
                  <th scope="col" className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const booking = bookingById.get(p.booking_id);
                  return (
                    <tr key={p.id}>
                      <td className="whitespace-nowrap font-medium tnum">{formatZar(p.amount_zar)}</td>
                      <td>
                        <Tag>{p.payment_type}</Tag>
                        {booking ? (
                          <span className="mt-0.5 block text-xs text-text-muted">
                            of {formatZar(booking.final_price_zar)}
                          </span>
                        ) : null}
                      </td>
                      <td>{nameById.get(p.payer_id) ?? '—'}</td>
                      <td>{nameById.get(p.payee_id) ?? '—'}</td>
                      <td className="tnum">{p.payshap_reference || '—'}</td>
                      <td className="max-w-[20rem]">
                        <span className="block truncate" title={p.dispute_reason ?? undefined}>
                          {p.dispute_reason || '—'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-text-muted">{formatTimeAgo(p.created_at)}</td>
                      <td>
                        <div className="flex justify-end">
                          <DecisionButtons
                            id={p.id}
                            action={resolveDispute}
                            choices={[
                              { label: 'Payment arrived', fields: { resolveAs: 'verified' }, tone: 'primary' },
                              { label: 'Did not arrive', fields: { resolveAs: 'rejected' }, tone: 'danger' },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
