import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { COUNTRY_LIST, countryBySlug } from '@smomo/shared';

import { PageHero } from '@/components/PageHero';
import { Container } from '@/components/ui';
import { CATEGORY_IMAGE, CATEGORY_LABEL, CATEGORY_SLUG_LIST } from '@/lib/catalog';

export const revalidate = 86400;

export function generateStaticParams() {
  return COUNTRY_LIST.map((c) => ({ country: c.slug }));
}

type Params = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { country: slug } = await params;
  const c = countryBySlug(slug);
  if (!c) return {};
  const names = [c.name, ...c.aka].join(' / ');
  return {
    title: `Beauty, hair, nails & tattoo pros in ${c.name}`,
    description: `Find independent hair, nail, make-up, beauty and tattoo professionals in ${names}. Browse by city, see their work and post your look on SMOMO.`,
    alternates: { canonical: `/country/${c.slug}` },
  };
}

/** Country hub: the cities and crafts we cover there. Provider lists live on the city pages. */
export default async function CountryHub({ params }: Params) {
  const { country: slug } = await params;
  const c = countryBySlug(slug);
  if (!c) notFound();

  return (
    <Container className="flex flex-col gap-5 pt-3">
      <PageHero
        crumbs={[{ href: '/', label: 'Home' }, { label: c.name }]}
        title={`Beauty pros in ${c.name}`}
        subtitle={
          c.aka.length
            ? `Hair, nails, make-up, beauty and tattoo pros across ${c.name} (also known as ${c.aka.join(', ')}).`
            : `Hair, nails, make-up, beauty and tattoo pros across ${c.name}.`
        }
        image="/editorial/community-walk.webp"
      >
        <div>
          <Link href="/app/request/new" className="btn btn-light">
            Post your look
          </Link>
        </div>
      </PageHero>

      <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="cities">
        <h2 id="cities" className="text-3xl sm:text-4xl">
          Cities in {c.name}
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {c.cities.map((city) => (
            <li key={city.slug}>
              <Link href={`/city/${city.slug}`} className="chip w-full justify-between px-5 py-3 text-base">
                {city.name}
                <span aria-hidden>↗</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-text-muted">
          Not in one of these? Post a request from anywhere in {c.name}. Pros near you will see it.
        </p>
      </section>

      <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="crafts">
        <h2 id="crafts" className="text-3xl sm:text-4xl">
          Browse by craft
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {CATEGORY_SLUG_LIST.map((cat) => (
            <Link key={cat} href={`/${cat}`} className="chip">
              <Image src={CATEGORY_IMAGE[cat]} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
              {CATEGORY_LABEL[cat]}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
