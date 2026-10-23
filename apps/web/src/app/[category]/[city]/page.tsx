import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProviderListCard } from '@/components/ProviderListCard';
import { PageHero } from '@/components/PageHero';
import { Container, EmptyState } from '@/components/ui';
import {
  CATEGORY_HERO,
  CATEGORY_IMAGE,
  CATEGORY_LABEL,
  CATEGORY_SLUG_LIST,
  CITIES,
  cityLabel,
  cityWithCountry,
  isCategorySlug,
  SLUG_TO_CATEGORY,
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
  const cityName = cityLabel(city);
  const title = `${label} in ${cityName}`;
  const description = `Find and book trusted ${label.toLowerCase()} in ${cityWithCountry(city)}. Compare portfolios and prices on SMOMO, then book — to you or at their studio.`;
  return {
    title,
    description,
    alternates: { canonical: `/${category}/${city}` },
    openGraph: { title: `${title} · SMOMO`, description },
  };
}

export default async function ListingPage({ params }: Params) {
  const { category, city } = await params;
  if (!isCategorySlug(category)) notFound();
  const cat = category as CategorySlug;
  const label = CATEGORY_LABEL[cat];
  const cityName = cityLabel(city);

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
    <Container className="flex flex-col gap-5 pt-3">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PageHero
        crumbs={[{ href: '/', label: 'Home' }, { href: `/${category}`, label }, { label: cityName }]}
        title={`${label} in ${cityName}`}
        subtitle={`${data?.total ?? 0} ${label.toLowerCase()} available near ${cityName}.`}
        image={CATEGORY_HERO[cat]}
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href={`/app/request/new?category=${SLUG_TO_CATEGORY[cat]}`} className="btn btn-light">
            Post a request
          </Link>
          <Link href={`/city/${city}`} className="btn border border-primary-400 text-white hover:bg-primary-900">
            All pros in {cityName}
          </Link>
        </div>
      </PageHero>

      <section className="rounded-[32px] bg-card p-6 sm:p-10">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((p) => (
              <ProviderListCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${label.toLowerCase()} in ${cityName} yet`}
            body={
              <>
                Post a request so pros can find you, or{' '}
                <Link href={`/${category}`} className="text-primary-700 underline underline-offset-4">
                  browse all {label.toLowerCase()}
                </Link>
                .
              </>
            }
            action={
              <Link href={`/app/request/new?category=${SLUG_TO_CATEGORY[cat]}`} className="btn btn-primary">
                Post a request
              </Link>
            }
          />
        )}
      </section>
    </Container>
  );
}
