import Link from 'next/link';

import { formatTimeAgo } from '@smomo/shared';

import { DecisionButtons } from '@/components/DecisionButtons';
import { Tag } from '@/components/Tag';
import { resolveReport } from '@/app/(console)/platform/actions';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Reports' };

const FILTERS = [
  { key: 'open', label: 'Needs a decision' },
  { key: 'all', label: 'All' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'dismissed', label: 'Dismissed' },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

const TONE: Record<string, 'ok' | 'warn' | 'danger' | 'neutral'> = {
  open: 'warn',
  reviewing: 'warn',
  resolved: 'ok',
  dismissed: 'neutral',
};

/**
 * User reports. `open` and `reviewing` are both undecided, so the default tab covers both
 * rather than making someone check two places for the same backlog.
 */
export default async function Reports({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.key === raw) ? (raw as Filter) : 'open';

  const supabase = await createClient();
  const base = supabase
    .from('reports')
    .select('id, reason, details, status, resolution, created_at, reporter_id, reported_user_id, booking_id')
    .order('created_at', { ascending: false });

  // Built as one expression: assigning a filtered builder back over the original collapses
  // the row type and silently un-checks every column below.
  const { data: reports, error } =
    filter === 'open'
      ? await base.in('status', ['open', 'reviewing'])
      : filter === 'all'
        ? await base
        : await base.eq('status', filter);
  if (error) throw error;

  const rows = reports ?? [];
  const people = [...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id]))];
  const { data: profiles } = people.length
    ? await supabase.from('profiles').select('id, full_name, is_practitioner').in('id', people)
    : { data: [] as { id: string; full_name: string | null; is_practitioner: boolean }[] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-text-muted">
          Raised by clients and pros about each other. Resolving records who actioned it.
        </p>
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'open' ? '/platform/reports' : `/platform/reports?status=${f.key}`}
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
            {filter === 'open' ? 'Nothing waiting.' : 'No reports with this status.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Reason</th>
                  <th scope="col">Reporter</th>
                  <th scope="col">Reported</th>
                  <th scope="col">Detail</th>
                  <th scope="col">Raised</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const reporter = nameById.get(r.reporter_id);
                  const reported = nameById.get(r.reported_user_id);
                  const undecided = r.status === 'open' || r.status === 'reviewing';
                  return (
                    <tr key={r.id}>
                      <td className="font-medium">{r.reason}</td>
                      <td>{reporter?.full_name ?? 'Someone'}</td>
                      <td>
                        {reported?.full_name ?? 'A user'}
                        {reported?.is_practitioner ? (
                          <span className="ml-1.5 text-xs text-text-muted">(pro)</span>
                        ) : null}
                      </td>
                      <td className="max-w-[22rem]">
                        <span className="block truncate" title={r.details ?? undefined}>
                          {r.details || '—'}
                        </span>
                        {r.resolution ? (
                          <span className="mt-0.5 block truncate text-xs text-text-muted">
                            Resolution: {r.resolution}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap text-text-muted">{formatTimeAgo(r.created_at)}</td>
                      <td>
                        <Tag tone={TONE[r.status] ?? 'neutral'}>{r.status}</Tag>
                      </td>
                      <td>
                        {undecided ? (
                          <div className="flex justify-end">
                            <DecisionButtons
                              id={r.id}
                              action={resolveReport}
                              choices={[
                                { label: 'Resolve', fields: { status: 'resolved' }, tone: 'primary' },
                                { label: 'Dismiss', fields: { status: 'dismissed' } },
                              ]}
                            />
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-text-muted">Decided</span>
                        )}
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
