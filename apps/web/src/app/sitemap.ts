import type { MetadataRoute } from 'next';

import { COUNTRY_LIST } from '@smomo/shared';

import { ALL_CITY_SLUGS, CATEGORY_SLUG_LIST, CITIES } from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '',
    '/how-it-works',
    '/download',
    ...CATEGORY_SLUG_LIST.map((c) => `/${c}`),
    ...COUNTRY_LIST.map((c) => `/country/${c.slug}`),
    ...ALL_CITY_SLUGS.map((c) => `/city/${c}`),
    ...CATEGORY_SLUG_LIST.flatMap((cat) => CITIES.map((city) => `/${cat}/${city}`)),
  ];
  return paths.map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: new Date(),
    changeFrequency: p === '' ? 'daily' : 'weekly',
    priority: p === '' ? 1 : 0.7,
  }));
}
