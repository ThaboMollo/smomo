import type { Metadata, Viewport } from 'next';

import { BrandStatement } from '@/components/landing/BrandStatement';
import { CraftsSection } from '@/components/landing/CraftsSection';
import { CreatorStory } from '@/components/landing/CreatorStory';
import { Hero } from '@/components/landing/Hero';
import { LooksSection } from '@/components/landing/LooksSection';
import { ProsSection } from '@/components/landing/ProsSection';
import { RequestSection } from '@/components/landing/RequestSection';
import { RevealController } from '@/components/landing/RevealController';
import { TalentSection } from '@/components/landing/TalentSection';
import { TrustSection } from '@/components/landing/TrustSection';
import { grotesk } from '@/lib/fonts';

// Provider listings are cached by the fetch layer (1h); the page itself revalidates hourly too.
export const revalidate = 3600;

const TITLE = 'SMOMO: Your look. Your people.';
const DESCRIPTION =
  'Find independent hair, nail, make-up, beauty and tattoo professionals near you. See their work, post your look and compare offers.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: { title: TITLE, description: DESCRIPTION, siteName: 'SMOMO', type: 'website', locale: 'en_ZA' },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

// The landing page is a fixed light-on-canvas design; it does not follow the app's dark theme.
export const viewport: Viewport = {
  themeColor: '#F4EFE7',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * SMOMO 2.0 landing page. The header and footer are swapped in by SiteHeader / SiteFooter
 * for this route (see components/landing), so the landmarks stay header / main / footer.
 */
export default function Home() {
  return (
    <div className={`${grotesk.variable} smomo-landing smomo-page`}>
      <Hero />
      <CraftsSection />
      <CreatorStory />
      <LooksSection />
      <TalentSection />
      <RequestSection />
      <TrustSection />
      <ProsSection />
      <BrandStatement />
      <RevealController />
    </div>
  );
}
