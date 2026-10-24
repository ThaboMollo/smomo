import Link from 'next/link';

import { categoryLabel, formatDateShort } from '@smomo/shared';

import { Tag, VerificationTag } from '@/components/Tag';
import { VerificationDecision } from '@/components/VerificationDecision';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Verification' };

/** The four statuses, as filter tabs. `queue` is the working set: anything undecided. */
const FILTERS = [
  { key: 'queue', label: 'Needs a decision' },
  { key: 'pending', label: 'Pending' },
  { key: 'unverified', label: 'Unverified' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
] as const;

type Filter = (typeof FILTERS)[number]['key'];

/**
 * The verification queue.
 *
 * An unverified pro cannot work at all — `make_offer` refuses them and the request feed
 * returns them nothing — so this is the gate on earning, not a cosmetic badge. Each row
 * therefore shows what the decision should be made against: the ID on file and its type,
 * the business name and the person's name, the categories claimed, and where they are
 * based. Approving on business name alone would be rubber-stamping.
 *
 * `user_identity` holds the ID number. It is row-secured, and a staff session reads it
 * through `is_admin()`; the number is shown masked, because confirming the last four
 * digits is enough to match a document and the full value has no business being on screen.
 */
export default async function Verification({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: raw } = await searchParams;
  const filter: Filter = FILTERS.some((f) => f.key === raw) ? (raw as Filter) : 'queue';

  const supabase = await createClient();

  // Built in one expression rather than reassigning a `query` variable: `.in()` and
  // `.eq()` return different builder types, so assigning either back over the original
  // collapses the row type to `never` and every column read below stops being checked.
  const base = supabase
    .from('practitioner_profiles')
    .select(
      'id, business_name, city, base_address, service_mode, verification_status, verified_at, created_at, years_experience',
    )
    .order('created_at', { ascending: true });

  const { data: pros, error } =
    filter === 'queue'
      ? await base.in('verification_status', ['pending', 'unverified'])
      : await base.eq('verification_status', filter);
  if (error) throw error;

  const ids = (pros ?? []).map((p) => p.id);

  // Three small lookups rather than an embedded select, so a missing row in any one of
  // them cannot drop a practitioner out of the queue entirely.
  const [{ data: people }, { data: identities }, { data: cats }] = await Promise.all([
    ids.length
      ? supabase.from('profiles').select('id, full_name, created_at').in('id', ids)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null; created_at: string }[] }),
    ids.length
      ? supabase
          .from('user_identity')
          .select('user_id, id_type, id_number, id_country, verification_status')
          .in('user_id', ids)
      : Promise.resolve({ data: [] as { user_id: string; id_type: string; id_number: string; id_country: string | null; verification_status: string }[] }),
    ids.length
      ? supabase.from('practitioner_categories').select('practitioner_id, category').in('practitioner_id', ids)
      : Promise.resolve({ data: [] as { practitioner_id: string; category: string }[] }),
  ]);

  const personById = new Map((people ?? []).map((p) => [p.id, p]));
  const identityById = new Map((identities ?? []).map((i) => [i.user_id, i]));
  const catsById = new Map<string, string[]>();
  for (const c of cats ?? []) {
    catsById.set(c.practitioner_id, [...(catsById.get(c.practitioner_id) ?? []), c.category]);
  }

  /** Last four only. Enough to match a document, with nothing to leak if the page is shared. */
  const maskId = (n: string) => (n.length <= 4 ? n : `${'•'.repeat(Math.min(n.length - 4, 9))}${n.slice(-4)}`);

  const rows = pros ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Verification</h1>
        <p className="mt-1 text-sm text-text-muted">
          A pro cannot receive requests or send offers until they are verified. Decide against
          the ID on file, not the business name.
        </p>
      </div>

      <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === 'queue' ? '/platform/verification' : `/platform/verification?status=${f.key}`}
            className="btn-console"
            aria-current={filter === f.key ? 'page' : undefined}
            data-active={filter === f.key || undefined}
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
            <span className="ml-2 font-normal text-text-muted tnum">{rows.length}</span>
          </h2>
        </div>

        {rows.length === 0 ? (
          <div className="panel-body text-sm text-text-muted">
            {filter === 'queue' ? 'Nothing waiting. Every pro has been decided.' : 'No pros with this status.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Business</th>
                  <th scope="col">Person</th>
                  <th scope="col">ID on file</th>
                  <th scope="col">Categories</th>
                  <th scope="col">Based</th>
                  <th scope="col">Registered</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-right">Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const person = personById.get(p.id);
                  const identity = identityById.get(p.id);
                  const categories = catsById.get(p.id) ?? [];
                  return (
                    <tr key={p.id}>
                      <td>
                        <span className="font-medium">{p.business_name ?? '—'}</span>
                        {p.years_experience != null ? (
                          <span className="ml-2 text-xs text-text-muted tnum">
                            {p.years_experience}y exp
                          </span>
                        ) : null}
                      </td>
                      <td>{person?.full_name ?? '—'}</td>
                      <td>
                        {identity ? (
                          <span className="flex flex-col gap-0.5">
                            <span className="tnum">{maskId(identity.id_number)}</span>
                            <span className="text-xs text-text-muted">
                              {identity.id_type === 'sa_id' ? 'SA ID' : 'Passport'}
                              {identity.id_country ? ` · ${identity.id_country}` : ''}
                            </span>
                          </span>
                        ) : (
                          // No ID means there is nothing to verify against — say so rather
                          // than leaving the cell blank and inviting a blind approval.
                          <Tag tone="danger">No ID submitted</Tag>
                        )}
                      </td>
                      <td>
                        {categories.length ? (
                          <span className="flex flex-wrap gap-1">
                            {categories.map((c) => (
                              <Tag key={c}>{categoryLabel(c as Parameters<typeof categoryLabel>[0])}</Tag>
                            ))}
                          </span>
                        ) : (
                          <Tag tone="warn">None</Tag>
                        )}
                      </td>
                      <td className="max-w-[16rem]">
                        <span className="block truncate">{p.city ?? p.base_address ?? '—'}</span>
                        <span className="text-xs text-text-muted">{p.service_mode}</span>
                      </td>
                      <td className="whitespace-nowrap text-text-muted">
                        {formatDateShort(person?.created_at ?? p.created_at)}
                      </td>
                      <td>
                        <VerificationTag status={p.verification_status} />
                      </td>
                      <td>
                        <div className="flex justify-end">
                          <VerificationDecision practitionerId={p.id} status={p.verification_status} />
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
