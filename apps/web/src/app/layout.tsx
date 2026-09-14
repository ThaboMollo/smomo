import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';
import { Container } from '@/components/ui';
import { CATEGORY_LABEL, CATEGORY_SLUG_LIST } from '@/lib/catalog';
import { SITE_NAME, SITE_URL } from '@/lib/env';

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
    <html lang="en">
      <body>
        <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
          <Container className="flex h-16 items-center justify-between gap-4">
            <Link href="/" className="text-xl font-extrabold tracking-tight">
              💅 Smomo
            </Link>
            <nav className="hidden items-center gap-5 text-sm font-medium text-text-muted md:flex">
              {CATEGORY_SLUG_LIST.map((c) => (
                <Link key={c} href={`/${c}`} className="hover:text-text">
                  {CATEGORY_LABEL[c]}
                </Link>
              ))}
            </nav>
            <Link
              href="/how-it-works"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              How it works
            </Link>
          </Container>
        </header>

        <main className="min-h-[70vh]">{children}</main>

        <footer className="mt-16 border-t border-border bg-card">
          <Container className="flex flex-col gap-2 py-10 text-sm text-text-muted">
            <p className="font-semibold text-text">Smomo</p>
            <p>Beauty, hair, nails, make-up & ink — booked to you or to their studio.</p>
            <p className="mt-2 text-text-faint">© {new Date().getFullYear()} Smomo. South Africa.</p>
          </Container>
        </footer>
      </body>
    </html>
  );
}
