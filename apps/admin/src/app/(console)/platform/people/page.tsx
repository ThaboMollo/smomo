import Link from 'next/link';

import { categoryLabel, formatDateShort } from '@smomo/shared';

import { Tag, VerificationTag } from '@/components/Tag';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Providers & users' };

const ROLES = [
  { key: 'pros', label: 'Pros' },
  { key: 'clients', label: 'Clients' },
] as const;

type Role = (typeof ROLES)[number]['key'];

/**
 * Read-only browser over everyone on the platform.
 *
 * Search is a server round trip on `?q=`, not client-side filtering, because the list is
 * not bounded — filtering a page of 50 would quietly hide matches on page 2.
 *
 * Deliberately shows no contact details and no ID numbers. Staff who need an ID to make a
 * verification decision see it (masked) in the verification queue, where there is a reason
 * to; a browse screen is not that reason, and `user_identity` is not read here at all.
 */
export default async function People({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>;
}) {
  const { role: rawRole, q: rawQ } = await searchParams;
  const role: Role = ROLES.some((r) => r.key === rawRole) ? (rawRole as Role) : 'pros';
  const q = (rawQ ?? '').trim();

  const supabase = await createClient();

  if (role === 'pros') {
    const base = supabase
      .from('practitioner_profiles')
      .select('id, business_name, city, service_mode, verification_status, is_online, rating, rating_count, jobs_done, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    const { data, error } = q ? await base.ilike('business_name', `%${q}%`) : await base;
    if (error) throw error;

    const rows = data ?? [];
    const ids = rows.map((r) => r.id);
    const [{ data: profiles }, { data: cats }, { data: subs }] = await Promise.all([
      ids.length ? supabase.from('profiles').select('id, full_name').in('id', ids) : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
      ids.length ? supabase.from('practitioner_categories').select('practitioner_id, category').in('practitioner_id', ids) : Promise.resolve({ data: [] as { practitioner_id: string; category: string }[] }),
      ids.length ? supabase.from('subscriptions').select('practitioner_id, status').in('practitioner_id', ids) : Promise.resolve({ data: [] as { practitioner_id: string; status: string }[] }),
    ]);
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const subById = new Map((subs ?? []).map((s) => [s.practitioner_id, s.status]));
    const catsById = new Map<string, string[]>();
    for (const c of cats ?? []) {
      catsById.set(c.practitioner_id, [...(catsById.get(c.practitioner_id) ?? []), c.category]);
    }

    return (
      <Shell role={role} q={q} count={rows.length}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Business</th>
              <th scope="col">Person</th>
              <th scope="col">Categories</th>
              <th scope="col">City</th>
              <th scope="col">Jobs</th>
              <th scope="col">Rating</th>
              <th scope="col">Subscription</th>
              <th scope="col">Verification</th>
              <th scope="col">Joined</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <span className="font-medium">{p.business_name ?? '—'}</span>
                  {p.is_online ? <Tag tone="ok">online</Tag> : null}
                </td>
                <td>{nameById.get(p.id) ?? '—'}</td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    {(catsById.get(p.id) ?? []).map((c) => (
                      <Tag key={c}>{categoryLabel(c as Parameters<typeof categoryLabel>[0])}</Tag>
                    ))}
                  </span>
                </td>
                <td>{p.city ?? '—'}</td>
                <td className="tnum">{p.jobs_done}</td>
                <td className="tnum">
                  {p.rating != null ? `${Number(p.rating).toFixed(1)} (${p.rating_count})` : 'New'}
                </td>
                <td>
                  {subById.get(p.id) ? (
                    <Tag tone={['trialing', 'active'].includes(subById.get(p.id)!) ? 'ok' : 'danger'}>
                      {subById.get(p.id)}
                    </Tag>
                  ) : (
                    <Tag tone="warn">none</Tag>
                  )}
                </td>
                <td><VerificationTag status={p.verification_status} /></td>
                <td className="whitespace-nowrap text-text-muted">{formatDateShort(p.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Shell>
    );
  }

  const base = supabase
    .from('profiles')
    .select('id, full_name, client_rating, client_rating_count, is_admin, created_at')
    .eq('is_practitioner', false)
    .order('created_at', { ascending: false })
    .limit(100);
  const { data, error } = q ? await base.ilike('full_name', `%${q}%`) : await base;
  if (error) throw error;
  const rows = data ?? [];

  return (
    <Shell role={role} q={q} count={rows.length}>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Rating as a client</th>
            <th scope="col">Role</th>
            <th scope="col">Joined</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td className="font-medium">{p.full_name ?? '—'}</td>
              <td className="tnum">
                {p.client_rating != null
                  ? `${Number(p.client_rating).toFixed(1)} (${p.client_rating_count})`
                  : 'No reviews'}
              </td>
              <td>{p.is_admin ? <Tag tone="ok">staff</Tag> : <Tag>client</Tag>}</td>
              <td className="whitespace-nowrap text-text-muted">{formatDateShort(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}

/** Shared chrome so the two branches cannot drift in layout. */
function Shell({
  role,
  q,
  count,
  children,
}: {
  role: Role;
  q: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Providers &amp; users</h1>
        <p className="mt-1 text-sm text-text-muted">
          Read-only. No contact details or ID numbers here — those appear only where a
          decision needs them.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <nav aria-label="Role" className="flex gap-1.5">
          {ROLES.map((r) => (
            <Link
              key={r.key}
              href={`/platform/people?role=${r.key}`}
              className="btn-console"
              aria-current={role === r.key ? 'page' : undefined}
              style={role === r.key ? { borderColor: 'var(--color-text)' } : undefined}
            >
              {r.label}
            </Link>
          ))}
        </nav>

        {/* GET, so a search is a shareable URL and the back button works. */}
        <form method="get" action="/platform/people" className="flex items-end gap-2">
          <input type="hidden" name="role" value={role} />
          <label className="field">
            <span className="text-xs font-medium text-text">Search</span>
            <input
              name="q"
              defaultValue={q}
              className="input"
              placeholder={role === 'pros' ? 'Business name' : 'Name'}
            />
          </label>
          <button type="submit" className="btn-console">Search</button>
          {q ? (
            <Link href={`/platform/people?role=${role}`} className="btn-console">Clear</Link>
          ) : null}
        </form>
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-head">
          <h2 className="panel-title">
            {role === 'pros' ? 'Pros' : 'Clients'}
            <span className="ml-2 font-normal tnum text-text-muted">{count}</span>
            {count === 100 ? (
              <span className="ml-2 text-xs font-normal text-text-muted">
                first 100 — narrow with search
              </span>
            ) : null}
          </h2>
        </div>
        {count === 0 ? (
          <div className="panel-body text-sm text-text-muted">
            {q ? 'Nothing matched that search.' : 'Nobody here yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </div>
    </div>
  );
}
