import Link from 'next/link';

import { formatZar } from '@smomo/shared';

import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Overview' };

/** A single figure. `href` turns it into the way in to the thing it counts. */
function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value tnum">{value}</p>
    </div>
  );
  return href ? (
    <Link href={href} className="panel transition-colors hover:bg-card-muted">
      {inner}
    </Link>
  ) : (
    <div className="panel">{inner}</div>
  );
}

/**
 * What each audience needs first.
 *
 * A professional sees their own pipeline. Staff additionally see what is waiting on them.
 * Every count is read with the caller's own session, so RLS decides what is countable —
 * a professional's "bookings" is their own, not the platform's, with no `eq()` needed.
 */
export default async function Overview() {
  const user = await requireUser();
  const supabase = await createClient();

  /**
   * `head: true` so only the count crosses the wire, not the rows. The filter callback is
   * typed off the builder itself rather than `any`, so a typo in a column name is a
   * compile error instead of a silently unfiltered count.
   */
  type CountQuery = ReturnType<ReturnType<typeof supabase.from>['select']>;
  const count = async (table: string, apply?: (q: CountQuery) => CountQuery) => {
    const base = supabase.from(table).select('*', { count: 'exact', head: true }) as CountQuery;
    const { count: n } = await (apply ? apply(base) : base);
    return n ?? 0;
  };

  const [myBookings, myOffers, openRequests] = user.isPractitioner
    ? await Promise.all([
        count('bookings', (q) => q.in('status', ['confirmed', 'in_progress'])),
        count('request_offers', (q) => q.eq('status', 'pending')),
        count('booking_requests', (q) => q.eq('status', 'open')),
      ])
    : [0, 0, 0];

  const [pendingVerification, openReports, openDisputes] = user.isStaff
    ? await Promise.all([
        count('practitioner_profiles', (q) => q.in('verification_status', ['pending', 'unverified'])),
        count('reports', (q) => q.eq('status', 'open')),
        count('payments', (q) => q.eq('status', 'disputed')),
      ])
    : [0, 0, 0];

  // Earnings to date: completed work only, so the figure matches what has actually been done.
  const { data: earned } = user.isPractitioner
    ? await supabase.from('bookings').select('final_price_zar').eq('status', 'completed')
    : { data: null };
  const earnedTotal = (earned ?? []).reduce((sum, b) => sum + Number(b.final_price_zar ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-text-muted">
          {user.isPractitioner
            ? 'Your business at a glance.'
            : user.isStaff
              ? 'What is waiting on you.'
              : 'Your account.'}
        </p>
      </div>

      {user.isStaff ? (
        <section aria-labelledby="staff-queue" className="space-y-3">
          <h2 id="staff-queue" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
            Waiting on staff
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Pros to verify" value={String(pendingVerification)} href="/platform/verification" />
            <Stat label="Open reports" value={String(openReports)} href="/platform/reports" />
            <Stat label="Payment disputes" value={String(openDisputes)} href="/platform/disputes" />
          </div>
        </section>
      ) : null}

      {user.isPractitioner ? (
        <section aria-labelledby="my-business" className="space-y-3">
          <h2 id="my-business" className="text-sm font-semibold uppercase tracking-[0.06em] text-text-muted">
            Your business
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Active bookings" value={String(myBookings)} href="/bookings" />
            <Stat label="Offers pending" value={String(myOffers)} href="/offers" />
            <Stat label="Open requests nearby" value={String(openRequests)} href="/offers" />
            <Stat label="Earned (completed)" value={formatZar(earnedTotal)} href="/earnings" />
          </div>
        </section>
      ) : null}

      {!user.isPractitioner && !user.isStaff ? (
        <div className="panel">
          <div className="panel-body text-sm text-text-muted">
            <p className="font-medium text-text">Nothing to manage here yet.</p>
            <p className="mt-1">
              This console is for SMOMO professionals and staff. If you have just registered as a
              professional, sign out and back in so your new role is picked up.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
