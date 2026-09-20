import type { Metadata } from 'next';
import { Cormorant_Garamond, Lora } from 'next/font/google';
import Image from 'next/image';
import Link from 'next/link';

import './globals.css';
import { Container } from '@/components/ui';
import { CATEGORY_LABEL, CATEGORY_SLUG_LIST } from '@/lib/catalog';
import { SITE_NAME, SITE_URL } from '@/lib/env';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
});
const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Smomo — Beauty, hair, nails, make-up & tattoo pros near you',
    template: '%s · Smomo',
  },
  description:
    'Find and book trusted hairdressers, nail technicians, make-up artists, beauticians and tattoo artists near you in South Africa. Post a request and get offers.',
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_ZA' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${lora.variable}`}>
      <body>
        <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
          <Container className="flex h-16 items-center justify-between gap-4">
            <Link href="/" aria-label="Smomo" className="shrink-0">
              <Image
                src="/assets/Smomo_logo_light.png"
                alt="Smomo"
                width={926}
                height={598}
                priority
                className="h-9 w-auto"
              />
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-text-muted md:flex">
              {CATEGORY_SLUG_LIST.map((c) => (
                <Link
                  key={c}
                  href={`/${c}`}
                  className="border-b border-transparent pb-0.5 hover:border-primary hover:text-text"
                >
                  {CATEGORY_LABEL[c]}
                </Link>
              ))}
            </nav>
            <Link
              href="/how-it-works"
              className="rounded border border-primary px-4 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-100"
            >
              How it works
            </Link>
          </Container>
        </header>

        <main className="min-h-[70vh]">{children}</main>

        <footer className="mt-16 border-t border-border bg-card">
          <Container className="py-12">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <Image
                  src="/assets/Smomo_logo_light.png"
                  alt="Smomo"
                  width={926}
                  height={598}
                  className="h-10 w-auto"
                />
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
      </body>
    </html>
  );
}
