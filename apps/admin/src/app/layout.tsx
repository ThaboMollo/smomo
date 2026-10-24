import type { Metadata, Viewport } from 'next';
import { DM_Sans } from 'next/font/google';

import './globals.css';
import { grotesk } from '@/lib/fonts';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dmsans',
});

export const metadata: Metadata = {
  title: { default: 'SMOMO Console', template: '%s · SMOMO Console' },
  description: 'Business and platform administration for SMOMO.',
  // Back-office: never indexed, no social cards.
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }] },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4EFE7' },
    { media: '(prefers-color-scheme: dark)', color: '#170F11' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
};

/**
 * Runs before paint so the console never flashes the wrong theme. Unlike the consumer
 * site — which forces light on its public pages — every page here is signed-in, so the
 * saved preference always applies, falling back to the OS setting. The key is `theme`,
 * the same one the web app and the mobile app use.
 */
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${grotesk.variable} ${dmSans.variable}`}>
      <body className="console">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {children}
      </body>
    </html>
  );
}
