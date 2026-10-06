'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Container } from '@/components/ui';
import { CATEGORY_LABEL, CATEGORY_SLUG_LIST } from '@/lib/catalog';

/** Marketing chrome is for public pages only; the app and auth screens carry their own nav. */
function hideChrome(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname.startsWith('/app');
}

const linkCls = 'text-text transition-colors hover:text-primary-700';

export function SiteFooter() {
  const pathname = usePathname();
  if (hideChrome(pathname)) return null;

  return (
    <Container className="pb-6 pt-16">
      <footer className="overflow-hidden rounded-[32px] bg-card px-6 pb-6 pt-10 sm:px-12 sm:pt-12">
        <div className="flex flex-col justify-between gap-10 lg:flex-row">
          <p className="max-w-md font-[family-name:var(--font-heading)] text-3xl leading-tight sm:text-4xl">
            Beauty, hair, nails, make-up and ink, booked to you or at their studio.
          </p>
          <div className="grid grid-cols-2 gap-10 text-[15px] sm:gap-20">
            <nav aria-label="Services" className="flex flex-col gap-3">
              <span className="kicker text-text-muted">Explore</span>
              {CATEGORY_SLUG_LIST.map((c) => (
                <Link key={c} href={`/${c}`} className={linkCls}>
                  {CATEGORY_LABEL[c]}
                </Link>
              ))}
            </nav>
            <nav aria-label="Smomo" className="flex flex-col gap-3">
              <span className="kicker text-text-muted">Smomo</span>
              <Link href="/how-it-works" className={linkCls}>
                How it works
              </Link>
              <Link href="/how-it-works#pros" className={linkCls}>
                For pros
              </Link>
              <Link href="/download" className={linkCls}>
                Get the app
              </Link>
              <Link href="/login" className={linkCls}>
                Log in
              </Link>
              <Link href="/register" className={linkCls}>
                Create account
              </Link>
            </nav>
          </div>
        </div>

        <p
          aria-hidden
          className="wordmark mt-12 select-none text-center text-[27vw] text-primary-900 dark:text-primary-700 xl:text-[330px]"
        >
          Smomo
        </p>

        <div className="mt-4 flex flex-col justify-between gap-2 border-t border-border pt-5 text-sm text-text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Smomo. South Africa.</span>
          <span className="font-[family-name:var(--font-mono)] text-xs tracking-[0.2em]">
            HAIR ✦ NAILS ✦ MAKE-UP ✦ BEAUTY ✦ TATTOO
          </span>
        </div>
      </footer>
    </Container>
  );
}
