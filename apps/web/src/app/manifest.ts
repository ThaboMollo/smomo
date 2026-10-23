import type { MetadataRoute } from 'next';
import { SITE_NAME } from '@/lib/env';

// Static manifest (no request-time APIs) so Next can cache it at build time.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME}: Your look. Your people.`,
    short_name: SITE_NAME,
    description:
      'Find independent hair, nail, make-up, beauty and tattoo professionals near you across South Africa, Lesotho, Eswatini, Botswana, Zimbabwe and Namibia. See their work, post your look and compare offers.',
    id: '/',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#251719',
    theme_color: '#251719',
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
