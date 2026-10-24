'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { BrandLogo } from '@/components/BrandLogo';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Container } from '@/components/ui';
import { useMe } from '@/lib/use-me';
import { CONSOLE_URL } from '@/lib/env';

/** `external` marks a destination in another app (the console), which Next's <Link>
 *  should not prefetch and which is never highlighted as the current page. */
type Item = { href: string; label: string; icon: ReactNode; exact?: boolean; external?: boolean };

const svg = (d: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
const ICONS = {
  home: svg(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />),
  discover: svg(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </>,
  ),
  chats: svg(<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />),
  studio: svg(
    <>
      <path d="M4 20h16" />
      <path d="M6 20V9l6-5 6 5v11" />
      <path d="M10 20v-5h4v5" />
    </>,
  ),
  requests: svg(
    <>
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 9h8M8 12h5" />
    </>,
  ),
  schedule: svg(
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>,
  ),
  profile: svg(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>,
  ),
  admin: svg(<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />),
};

/**
 * One nav destination. An `external` item renders a plain anchor: `<Link>` would try to
 * client-navigate and prefetch a different application, which cannot work and wastes a
 * request on every nav render.
 */
function NavLink({
  item,
  current,
  className,
  children,
}: {
  item: Item;
  current: boolean;
  className: string;
  children: ReactNode;
}) {
  if (item.external) {
    return (
      <a href={item.href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={item.href} aria-current={current ? 'page' : undefined} className={className}>
      {children}
    </Link>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const { data } = useMe();
  const isPractitioner = !!data?.profile?.is_practitioner;
  const isAdmin = !!data?.profile?.is_admin;

  /**
   * The pro and staff destinations moved to the SMOMO Console (`apps/admin`), so the nav
   * sends people there instead of to local copies: Requests became Offers, Schedule became
   * Bookings, Studio became My studio, Admin became Platform. `/app/studio` is kept for
   * a client who is not a pro yet, because it is also the "become a pro" onboarding.
   */
  const items: Item[] = [
    { href: '/app', label: 'Home', icon: ICONS.home, exact: true },
    { href: '/app/discover', label: 'Discover', icon: ICONS.discover },
    { href: '/app/chats', label: 'Chats', icon: ICONS.chats },
    ...(isPractitioner
      ? [{ href: CONSOLE_URL, label: 'Console', icon: ICONS.studio, external: true }]
      : [{ href: '/app/studio', label: 'Become a pro', icon: ICONS.studio }]),
    ...(isAdmin && !isPractitioner
      ? [{ href: `${CONSOLE_URL}/platform`, label: 'Admin', icon: ICONS.admin, external: true }]
      : []),
  ];

  // An external destination is never "active" — the console is a different app.
  const isActive = (it: Item) =>
    it.external ? false : it.exact ? pathname === it.href : pathname.startsWith(it.href);

  // Mobile tab bar: the most-used destinations only, profile last.
  // Mobile tab bar: the most-used destinations only, profile last. Built by filtering the
  // list above rather than looking items up by href, which broke whenever one moved.
  const mobileItems: Item[] = [
    items[0],
    items[1],
    items.find((i) => i.href === '/app/chats')!,
    items.find((i) => i.external || i.href === '/app/studio')!,
    { href: '/app/profile', label: 'Profile', icon: ICONS.profile },
  ].filter(Boolean);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/85 backdrop-blur-md">
        <Container className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-5">
            <Link href="/app" aria-label="SMOMO home" className="shrink-0">
              <BrandLogo className="h-8 w-auto" priority />
            </Link>
            <nav aria-label="App" className="hidden items-center gap-1 md:flex">
              {items.map((it) => (
                <NavLink
                  key={it.href}
                  item={it}
                  current={isActive(it)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${isActive(it) ? 'bg-primary-200 font-medium text-primary-700' : 'text-text-muted hover:bg-primary-100 hover:text-text'}`}
                >
                  {it.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/request/new" className="btn btn-primary hidden lg:inline-flex">
              Post a request
            </Link>
            <ThemeToggle />
            <Link
              href="/app/profile"
              aria-label="Profile"
              aria-current={pathname.startsWith('/app/profile') ? 'page' : undefined}
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-text-muted hover:bg-primary-100 md:inline-flex"
            >
              {ICONS.profile}
            </Link>
            <span className="hidden md:inline">
              <SignOutButton />
            </span>
          </div>
        </Container>
      </header>

      {/* Mobile bottom tab bar */}
      <nav
        aria-label="App"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto flex max-w-md justify-around px-2 pt-1.5">
          {mobileItems.map((it) => {
            const on = isActive(it);
            return (
              <NavLink
                key={it.href}
                item={it}
                current={on}
                className={`flex min-w-[64px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] ${on ? 'font-medium text-primary-700' : 'text-text-muted'}`}
              >
                <span className={`flex h-8 w-12 items-center justify-center rounded-full ${on ? 'bg-primary-200' : ''}`}>{it.icon}</span>
                {it.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
