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
import { getCategoryHub } from '@/lib/public-api';

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORY_SLUG_LIST.map((category) => ({ category }));
}

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  if (!isCategorySlug(category)) return {};
  const label = CATEGORY_LABEL[category];
  return {
    title: `${label} near you in South Africa`,
    description: `Book trusted ${label.toLowerCase()} across South Africa on Smomo. Browse by city, compare ratings and portfolios, and book to you or at their studio.`,
    alternates: { canonical: `/${category}` },
  };
}

export default async function CategoryHub({ params }: Params) {
  const { category } = await params;
  if (!isCategorySlug(category)) notFound();
  const cat = category as CategorySlug;
  const label = CATEGORY_LABEL[cat];
  const data = await getCategoryHub(category);
  const items = data?.items ?? [];

  return (
    <Container className="py-10">
      <h1 className="text-4xl tracking-tight">{label} in South Africa</h1>

      <h2 className="mt-8 text-lg">Browse {label.toLowerCase()} by city</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {CITIES.map((city) => (
          <Link
            key={city}
            href={`/${category}/${city}`}
            className="rounded border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-card-muted"
          >
            {label} in {titleCase(city)}
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-lg">Top {label.toLowerCase()}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <ProviderListCard key={p.id} p={p} />
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-text-muted">No {label.toLowerCase()} listed yet — check back soon.</p>
      ) : null}
    </Container>
  );
}
