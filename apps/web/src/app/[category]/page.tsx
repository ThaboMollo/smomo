import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHero } from '@/components/PageHero';
import { ProviderListCard } from '@/components/ProviderListCard';
import { Container, EmptyState, Kicker } from '@/components/ui';
import {
  CATEGORY_HERO,
  CATEGORY_IMAGE,
  CATEGORY_LABEL,
  CATEGORY_NOTE,
  CATEGORY_SLUG_LIST,
  CITIES,
  isCategorySlug,
  SLUG_TO_CATEGORY,
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
    title: `${label} near you in Southern Africa`,
    description: `Book trusted ${label.toLowerCase()} across South Africa, Lesotho, Eswatini, Botswana, Zimbabwe and Namibia on SMOMO. Browse by city, compare portfolios and prices, and book to you or at their studio.`,
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
    <Container className="flex flex-col gap-5 pt-3">
      <PageHero
        crumbs={[{ href: '/', label: 'Home' }, { label }]}
        title={`${label} in Southern Africa`}
        subtitle={CATEGORY_NOTE[cat]}
        image={CATEGORY_HERO[cat]}
      >
        <div className="flex flex-wrap gap-2 pt-2">
          <Link href={`/app/request/new?category=${SLUG_TO_CATEGORY[cat]}`} className="btn btn-light">
            Post a request
          </Link>
        </div>
      </PageHero>

      <section className="rounded-[32px] bg-card p-6 sm:p-10">
        <Kicker>By city</Kicker>
        <div className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
          {CITIES.map((city) => (
            <Link key={city} href={`/${category}/${city}`} className="chip">
              {titleCase(city)}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="top">
        <h2 id="top" className="text-3xl sm:text-4xl">
          Top {label.toLowerCase()}
        </h2>
        {items.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((p) => (
              <ProviderListCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title={`No ${label.toLowerCase()} listed yet`}
              body="Post a request and we'll notify pros as they join near you."
              action={
                <Link href="/app/request/new" className="btn btn-primary">
                  Post a request
                </Link>
              }
            />
          </div>
        )}
      </section>
    </Container>
  );
}
