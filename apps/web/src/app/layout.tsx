import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Lora } from 'next/font/google';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';

import './globals.css';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import { PwaProvider } from '@/components/PwaProvider';
import { SITE_NAME, SITE_URL } from '@/lib/env';

// We import the Font Awesome CSS manually above; disable auto-injection so the
// App Router SSR pass doesn't flash oversized icons before hydration.
config.autoAddCss = false;

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
  applicationName: SITE_NAME,
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_NAME,
  },
  formatDetection: { telephone: false },
  openGraph: { siteName: SITE_NAME, type: 'website', locale: 'en_ZA' },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#6d28d9' },
    { media: '(prefers-color-scheme: dark)', color: '#2e1065' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Runs before paint so the correct theme is applied with no flash of the wrong one.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${lora.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <SiteHeader />
        <main className="min-h-[70vh]">{children}</main>
        <SiteFooter />
        <PwaProvider />
      </body>
    </html>
  );
}
