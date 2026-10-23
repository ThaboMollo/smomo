'use client';

import { usePathname } from 'next/navigation';

import { LandingFooter } from '@/components/landing/LandingFooter';
import { grotesk } from '@/lib/fonts';

/** The signed-in app and the sign-in screens carry their own chrome. */
function hideChrome(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname.startsWith('/app');
}

/** The SMOMO footer on every public page. */
export function SiteFooter() {
  const pathname = usePathname();
  if (hideChrome(pathname)) return null;
  return (
    <div className={`${grotesk.variable} smomo-landing contents`}>
      <LandingFooter />
    </div>
  );
}
