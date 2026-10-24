import Link from 'next/link';

import { ConsoleNav } from '@/components/ConsoleNav';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { requireUser } from '@/lib/session';

/**
 * The signed-in shell: a fixed sidebar on desktop, a collapsible one on small screens.
 *
 * `requireUser` runs here so every page under this group is both authenticated and
 * role-resolved once per navigation, rather than each page repeating it. Middleware has
 * already bounced anonymous visitors; this is what turns a session into a role.
 */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const name = user.businessName || user.fullName || user.email || 'Your account';
  const unverified = user.isPractitioner && user.verificationStatus !== 'verified';

  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[15rem_1fr]">
      {/* ── Sidebar ── */}
      <aside className="border-b border-border bg-card px-3 py-3 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto lg:border-b-0 lg:border-r">
        <ConsoleNav isStaff={user.isStaff} isPractitioner={user.isPractitioner} />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-bg/85 px-4 py-2.5 backdrop-blur-sm sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-text">{name}</p>
            <p className="truncate text-xs text-text-muted">
              {user.isStaff ? 'Staff' : user.isPractitioner ? 'Professional' : 'Account'}
              {user.email ? ` · ${user.email}` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>

        {/* A pro whose account is not verified yet cannot receive work at all — make that
            the first thing they see rather than leaving them to wonder why the feed is
            empty. `make_offer` and the request feed both refuse an unverified account. */}
        {unverified ? (
          <div className="border-b border-border bg-warning-soft px-4 py-2.5 text-sm text-warning sm:px-6">
            <span className="font-medium">
              {user.verificationStatus === 'pending'
                ? 'Your account is awaiting verification.'
                : user.verificationStatus === 'rejected'
                  ? 'Your verification was not approved.'
                  : 'Your account is not verified yet.'}
            </span>{' '}
            You will not appear in search or receive requests until it is.{' '}
            <Link href="/studio" className="font-medium underline underline-offset-4">
              Check your details
            </Link>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
