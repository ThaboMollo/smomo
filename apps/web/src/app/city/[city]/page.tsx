import type { Metadata } from 'next';
import Link from 'next/link';

import { ProviderListCard } from '@/components/ProviderListCard';
import { Container } from '@/components/ui';
import { CATEGORY_LABEL, CATEGORY_SLUG_LIST, CITIES, titleCase } from '@/lib/catalog';
import { getCityHub } from '@/lib/public-api';

export const revalidate = 3600;

export function generateStaticParams() {
  return CITIES.map((city) => ({ city }));
}

type Params = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { city } = await params;
  const cityName = titleCase(city);
  return {
    title: `Beauty, hair, nails & tattoo pros in ${cityName}`,
    description: `Find and book beauty, hair, nail, make-up and tattoo professionals in ${cityName} on Smomo.`,
    alternates: { canonical: `/city/${city}` },
  };
}

export default async function CityHub({ params }: Params) {
  const { city } = await params;
  const cityName = titleCase(city);
  const data = await getCityHub(city);
  const items = data?.items ?? [];

  return (
    <Container className="py-10">
      <h1 className="text-4xl tracking-tight">Pros in {cityName}</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORY_SLUG_LIST.map((c) => (
          <Link
            key={c}
            href={`/${c}/${city}`}
            className="rounded border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-card-muted"
          >
            {CATEGORY_LABEL[c]} in {cityName}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <ProviderListCard key={p.id} p={p} />
        ))}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-text-muted">No pros listed in {cityName} yet — check back soon.</p>
      ) : null}
    </Container>
  );
}
