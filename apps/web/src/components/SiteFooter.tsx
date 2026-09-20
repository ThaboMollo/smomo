'use client';

import { usePathname } from 'next/navigation';

import { BrandLogo } from '@/components/BrandLogo';
import { Container } from '@/components/ui';

/** Marketing chrome is for public pages only — the app and auth screens carry their own nav. */
function hideChrome(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname.startsWith('/app');
}

export function SiteFooter() {
  const pathname = usePathname();
  if (hideChrome(pathname)) return null;

  return (
    <footer className="mt-16 border-t border-border bg-card">
      <Container className="py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <BrandLogo className="h-10 w-auto" />
            <p className="mt-3 max-w-sm text-sm text-text-muted">
              Beauty, hair, nails, make-up &amp; ink — booked to you or to their studio.
            </p>
          </div>
          <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-text-muted">
            Hair ✦ Nails ✦ Make-up ✦ Beauty ✦ Tattoo
          </p>
        </div>
        <hr className="hr my-8" />
        <p className="text-sm text-text-faint">© {new Date().getFullYear()} Smomo. South Africa.</p>
      </Container>
    </footer>
  );
}
