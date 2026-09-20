import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated app + auth screens carry no SEO value and shouldn't be indexed.
        disallow: ['/app/', '/login', '/register', '/offline'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
