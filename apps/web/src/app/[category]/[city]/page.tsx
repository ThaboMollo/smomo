import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProviderListCard } from '@/components/ProviderListCard';
import { Container } from '@/components/ui';
import {
  CATEGORY_LABEL,
  CATEGORY_SLUG_LIST,
  CITIES,
  isCategorySlug,
  titleCase,
  type CategorySlug,
} from '@/lib/catalog';
import { SITE_URL } from '@/lib/env';
import { getListing } from '@/lib/public-api';

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORY_SLUG_LIST.flatMap((category) => CITIES.map((city) => ({ category, city })));
}

type Params = { params: Promise<{ category: string; city: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category, city } = await params;
  if (!isCategorySlug(category)) return {};
  const label = CATEGORY_LABEL[category];
  const cityName = titleCase(city);
  const title = `${label} in ${cityName}`;
  const description = `Find and book trusted ${label.toLowerCase()} in ${cityName}. Compare ratings, portfolios and prices on Smomo, then book — to you or at their studio.`;
  return {
    title,
    description,
    alternates: { canonical: `/${category}/${city}` },
    openGraph: { title: `${title} · Smomo`, description },
  };
}

export default async function ListingPage({ params }: Params) {
  const { category, city } = await params;
  if (!isCategorySlug(category)) notFound();
  const cat = category as CategorySlug;
  const label = CATEGORY_LABEL[cat];
  const cityName = titleCase(city);

  const data = await getListing(category, city);
  const items = data?.items ?? [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${label} in ${cityName}`,
    itemListElement: items.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/pro/${p.slug}`,
      name: p.business_name ?? 'Provider',
    })),
  };

  return (
    <Container className="py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav className="text-sm text-text-muted">
        <Link href="/" className="hover:text-text">
          Home
        </Link>{' '}
        / <Link href={`/${category}`} className="hover:text-text">{label}</Link> / {cityName}
      </nav>

      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
        {label} in {cityName}
      </h1>
      <p className="mt-1 text-text-muted">
        {data?.total ?? 0} {label.toLowerCase()} available near {cityName}.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <ProviderListCard key={p.id} p={p} />
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-10 text-text-muted">
          No {label.toLowerCase()} listed in {cityName} yet — check back soon, or{' '}
          <Link href={`/${category}`} className="text-primary">
            browse all {label.toLowerCase()}
          </Link>
          .
        </p>
      ) : null}
    </Container>
  );
}
