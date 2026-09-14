'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { formatZar } from '@smomo/shared';

import { Badge, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

export default function Admin() {
  const me = useMe();
  const qc = useQueryClient();

  const reports = useQuery({ queryKey: ['admin', 'reports'], queryFn: () => api.admin.reports(), enabled: !!me.data?.profile?.is_admin });
  const disputes = useQuery({ queryKey: ['admin', 'disputes'], queryFn: () => api.admin.disputes(), enabled: !!me.data?.profile?.is_admin });

  const resolveReport = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'resolved' | 'dismissed' }) => api.admin.resolveReport(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] }),
  });
  const resolveDispute = useMutation({
    mutationFn: ({ id, resolveAs }: { id: string; resolveAs: 'verified' | 'rejected' }) => api.admin.resolveDispute(id, resolveAs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }),
  });

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!me.data?.profile?.is_admin) return <p className="text-text-muted">Not authorised.</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Payment disputes</h1>
        <div className="mt-4 space-y-3">
          {(disputes.data ?? []).map((d: any) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{formatZar(d.amount_zar)} · {d.payment_type}</span>
                <Badge tone="danger">disputed</Badge>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {d.payer?.full_name ?? 'Client'} → {d.payee?.full_name ?? 'Provider'}
                {d.payshap_reference ? ` · ref ${d.payshap_reference}` : ''}
              </p>
              {d.dispute_reason ? <p className="mt-1 text-sm">Reason: {d.dispute_reason}</p> : null}
              <div className="mt-3 flex gap-2">
                <button onClick={() => resolveDispute.mutate({ id: d.id, resolveAs: 'verified' })} disabled={resolveDispute.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Mark verified
                </button>
                <button onClick={() => resolveDispute.mutate({ id: d.id, resolveAs: 'rejected' })} disabled={resolveDispute.isPending} className="rounded-xl border border-border px-4 py-2 text-sm">
                  Reject
                </button>
              </div>
            </Card>
          ))}
          {disputes.data && disputes.data.length === 0 ? <p className="text-text-muted">No open disputes.</p> : null}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold">Reports</h2>
        <div className="mt-4 space-y-3">
          {(reports.data ?? []).map((r: any) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.reason}</span>
                <Badge tone={r.status === 'open' ? 'primary' : 'default'}>{r.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {r.reporter?.full_name ?? 'Someone'} reported {r.reported?.full_name ?? 'a user'}
              </p>
              {r.details ? <p className="mt-1 text-sm">{r.details}</p> : null}
              {r.status === 'open' || r.status === 'reviewing' ? (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => resolveReport.mutate({ id: r.id, status: 'resolved' })} disabled={resolveReport.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    Resolve
                  </button>
                  <button onClick={() => resolveReport.mutate({ id: r.id, status: 'dismissed' })} disabled={resolveReport.isPending} className="rounded-xl border border-border px-4 py-2 text-sm">
                    Dismiss
                  </button>
                </div>
              ) : null}
            </Card>
          ))}
          {reports.data && reports.data.length === 0 ? <p className="text-text-muted">No reports.</p> : null}
        </div>
      </section>
    </div>
  );
}
