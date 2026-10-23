import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { ProviderListCard } from '@/components/ProviderListCard';
import { PageHero } from '@/components/PageHero';
import { Container, EmptyState } from '@/components/ui';
import { CATEGORY_IMAGE, CATEGORY_LABEL, CATEGORY_SLUG_LIST, CITIES, titleCase } from '@/lib/catalog';
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
    <Container className="flex flex-col gap-5 pt-3">
      <PageHero
        crumbs={[{ href: '/', label: 'Home' }, { label: cityName }]}
        title={`Pros in ${cityName}`}
        subtitle={`Hair, nails, make-up, beauty and tattoo pros around ${cityName}.`}
        image="/samples/hair_dresser2.jpg"
      />

      <section className="rounded-[32px] bg-card p-6 sm:p-10">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap">
          {CATEGORY_SLUG_LIST.map((c) => (
            <Link key={c} href={`/${c}/${city}`} className="chip">
              <Image src={CATEGORY_IMAGE[c]} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
              {CATEGORY_LABEL[c]}
            </Link>
          ))}
        </div>
        {items.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {items.map((p) => (
              <ProviderListCard key={p.id} p={p} />
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title={`No pros listed in ${cityName} yet`}
              body="Post a request and pros nearby will see it as they come online."
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
