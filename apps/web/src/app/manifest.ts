import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/env';

// Static manifest (no request-time APIs) so Next can cache it at build time.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Beauty, hair, nails, make-up & tattoo pros`,
    short_name: SITE_NAME,
    description:
      'Find and book trusted hairdressers, nail technicians, make-up artists, beauticians and tattoo artists near you in South Africa. Post a request and get offers.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf9fc',
    theme_color: '#6d28d9',
    lang: 'en-ZA',
    categories: ['lifestyle', 'shopping', 'beauty'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Discover pros',
        short_name: 'Discover',
        url: '/app/discover?source=pwa',
      },
      {
        name: 'Post a request',
        short_name: 'Request',
        url: '/app/request/new?source=pwa',
      },
    ],
  };
}
