import Link from 'next/link';

import { formatZar } from '@smomo/shared';

import { Tag } from '@/components/Tag';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Platform' };

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const inner = (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value tnum">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-text-muted">{sub}</p> : null}
    </div>
  );
  return href ? (
    <Link href={href} className="panel transition-colors hover:bg-card-muted">{inner}</Link>
  ) : (
    <div className="panel">{inner}</div>
  );
}

/**
 * Platform health.
 *
 * Deliberately counts rather than charts: at this size the useful question is "how many,
 * and is anything stuck", not "what is the trend". Each figure links to the list behind it
 * so a number is never a dead end.
 *
 * Counts are read with the staff member's own session, so `is_admin()` and RLS decide what
 * is countable — nothing here uses a service key.
 */
export default async function Platform() {
  const supabase = await createClient();
  const n = async (p: PromiseLike<{ count: number | null }>) => (await p).count ?? 0;

  const [
    prosTotal, prosVerified, prosPending, prosRejected,
    clients, requestsOpen, requestsTotal,
    bookingsActive, bookingsDone, disputes, reportsOpen,
    subsTrialing, subsActive,
  ] = await Promise.all([
    n(supabase.from('practitioner_profiles').select('*', { count: 'exact', head: true })),
    n(supabase.from('practitioner_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'verified')),
    n(supabase.from('practitioner_profiles').select('*', { count: 'exact', head: true }).in('verification_status', ['pending', 'unverified'])),
    n(supabase.from('practitioner_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'rejected')),
    n(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_practitioner', false)),
    n(supabase.from('booking_requests').select('*', { count: 'exact', head: true }).eq('status', 'open')),
    n(supabase.from('booking_requests').select('*', { count: 'exact', head: true })),
    n(supabase.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['confirmed', 'in_progress'])),
    n(supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed')),
    n(supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'disputed')),
    n(supabase.from('reports').select('*', { count: 'exact', head: true }).in('status', ['open', 'reviewing'])),
    n(supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'trialing')),
    n(supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')),
  ]);

  // Gross value of completed work. Verified payments only would understate it while
  // PayShap confirmation is manual, so this is booked value, labelled as such.
  const { data: done } = await supabase
    .from('bookings')
    .select('final_price_zar')
    .eq('status', 'completed');
  const gross = (done ?? []).reduce((s, b) => s + Number(b.final_price_zar ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform</h1>
        <p className="mt-1 text-sm text-text-muted">Where SMOMO is right now.</p>
      </div>

      <section aria-labelledby="attention" className="space-y-3">
        <h2 id="attention" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
          Needs attention
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Pros to verify" value={String(prosPending)} href="/platform/verification" sub="Cannot work until verified" />
          <Stat label="Open reports" value={String(reportsOpen)} href="/platform/reports" />
          <Stat label="Payment disputes" value={String(disputes)} href="/platform/disputes" />
        </div>
      </section>

      <section aria-labelledby="people-stats" className="space-y-3">
        <h2 id="people-stats" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
          People
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pros" value={String(prosTotal)} href="/platform/people" />
          <Stat label="Verified" value={String(prosVerified)} href="/platform/verification?status=verified" />
          <Stat label="Rejected" value={String(prosRejected)} href="/platform/verification?status=rejected" />
          <Stat label="Clients" value={String(clients)} href="/platform/people?role=clients" />
        </div>
      </section>

      <section aria-labelledby="marketplace" className="space-y-3">
        <h2 id="marketplace" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
          Marketplace
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Open requests" value={String(requestsOpen)} sub={`${requestsTotal} all time`} />
          <Stat label="Active bookings" value={String(bookingsActive)} />
          <Stat label="Completed" value={String(bookingsDone)} />
          <Stat label="Booked value" value={formatZar(gross)} sub="Completed bookings, gross" />
        </div>
      </section>

      <section aria-labelledby="subs" className="space-y-3">
        <h2 id="subs" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
          Subscriptions
        </h2>
        <div className="panel">
          <div className="panel-body flex flex-wrap items-center gap-3 text-sm">
            <Tag tone="ok">{subsActive} active</Tag>
            <Tag tone="warn">{subsTrialing} trialing</Tag>
            <span className="text-text-muted">
              Pros need a trialing or active subscription to send offers.
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
