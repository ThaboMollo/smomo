'use client';

import { usePathname } from 'next/navigation';

import { LandingHeader } from '@/components/landing/LandingHeader';
import { grotesk } from '@/lib/fonts';

/** The signed-in app and the sign-in screens carry their own chrome. */
function hideChrome(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname.startsWith('/app');
}

/** The SMOMO header on every public page. */
export function SiteHeader() {
  const pathname = usePathname();
  if (hideChrome(pathname)) return null;
  return (
    <div className={`${grotesk.variable} smomo-landing contents`}>
      <LandingHeader />
    </div>
  );
}
