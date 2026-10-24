'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SmomoMark } from '@/components/SmomoMark';

/**
 * The console sidebar. Two groups: the professional's own business, and — only for staff —
 * the platform sections. The staff group is omitted entirely rather than disabled, so a
 * professional is never shown the existence of tools they cannot open.
 */
type Item = { href: string; label: string; icon: React.ReactNode };

const icon = (d: React.ReactNode) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
    {d}
  </svg>
);

const ICONS = {
  overview: icon(<><path d="M3 12h7V3H3zM14 21h7v-9h-7zM14 8h7V3h-7zM3 21h7v-5H3z" /></>),
  studio: icon(<><path d="M3 21h18M5 21V8l7-5 7 5v13" /><path d="M9 21v-6h6v6" /></>),
  services: icon(<><path d="M4 7h16M4 12h16M4 17h10" /></>),
  portfolio: icon(<><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15l5-4 4 3 3-2 6 4" /><circle cx="9" cy="8" r="1.4" /></>),
  offers: icon(<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6Z" /><circle cx="8" cy="8" r="1.4" /></>),
  bookings: icon(<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 11h18" /></>),
  earnings: icon(<><path d="M3 17l5-5 4 3 4-6 5 5" /><path d="M3 21h18" /></>),
  verification: icon(<><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9.5 12l1.8 1.8L15 10" /></>),
  reports: icon(<><path d="M12 3 2 20h20L12 3Z" /><path d="M12 9v5M12 17h.01" /></>),
  disputes: icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16h.01" /></>),
  people: icon(<><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M17 11.2A3.2 3.2 0 1 0 17 5" /><path d="M18 20a6.4 6.4 0 0 0-2-4.6" /></>),
  metrics: icon(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>),
};

const BUSINESS: Item[] = [
  { href: '/', label: 'Overview', icon: ICONS.overview },
  { href: '/studio', label: 'My studio', icon: ICONS.studio },
  { href: '/services', label: 'Services', icon: ICONS.services },
  { href: '/portfolio', label: 'Portfolio', icon: ICONS.portfolio },
  { href: '/offers', label: 'Offers', icon: ICONS.offers },
  { href: '/bookings', label: 'Bookings', icon: ICONS.bookings },
  { href: '/earnings', label: 'Earnings', icon: ICONS.earnings },
];

const PLATFORM: Item[] = [
  { href: '/platform', label: 'Platform', icon: ICONS.metrics },
  { href: '/platform/verification', label: 'Verification', icon: ICONS.verification },
  { href: '/platform/reports', label: 'Reports', icon: ICONS.reports },
  { href: '/platform/disputes', label: 'Disputes', icon: ICONS.disputes },
  { href: '/platform/people', label: 'Providers & users', icon: ICONS.people },
];

function isCurrent(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  // `/platform` must not light up while on `/platform/reports`.
  if (href === '/platform') return pathname === '/platform';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConsoleNav({
  isStaff,
  isPractitioner,
}: {
  isStaff: boolean;
  isPractitioner: boolean;
}) {
  const pathname = usePathname();

  const render = (items: Item[]) =>
    items.map((it) => (
      <Link
        key={it.href}
        href={it.href}
        className="nav-item"
        aria-current={isCurrent(pathname, it.href) ? 'page' : undefined}
      >
        {it.icon}
        <span className="truncate">{it.label}</span>
      </Link>
    ));

  return (
    <nav aria-label="Console" className="flex flex-col gap-1">
      <Link href="/" className="mb-3 inline-flex items-center gap-2 px-1.5 text-text">
        <SmomoMark className="h-6" />
        <span className="smomo-wordmark text-xl">smomo</span>
        <span className="ml-0.5 rounded-md border border-border px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Console
        </span>
      </Link>

      {/* A staff member who is not a practitioner has no business sections to show. */}
      {isPractitioner ? (
        <>
          <p className="nav-section">Your business</p>
          {render(BUSINESS)}
        </>
      ) : (
        render([BUSINESS[0]])
      )}

      {isStaff ? (
        <>
          <p className="nav-section mt-3">Platform</p>
          {render(PLATFORM)}
        </>
      ) : null}
    </nav>
  );
}
