import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SOCIAL_PLATFORMS, socialUrl } from '@smomo/shared';

import { CATEGORY_LABEL, CATEGORY_SLUGS } from '@/lib/catalog';
import { Icon } from '@/components/Icon';
import { Avatar, Container, Plate, Stars } from '@/components/ui';
import { cardPhoto } from '@/lib/images';
import { SITE_URL } from '@/lib/env';
import { getProvider } from '@/lib/public-api';

export const revalidate = 900;

type Params = { params: Promise<{ slug: string }> };

function formatZar(n: number | null | undefined) {
  return n == null ? null : `R${Number(n).toLocaleString('en-ZA')}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProvider(slug);
  if (!p) return { title: 'Provider not found' };
  const cats = p.categories.map((c) => CATEGORY_LABEL[CATEGORY_SLUGS[c]]).join(', ');
  const where = p.base_address ? ` in ${p.base_address}` : '';
  return {
    title: `${p.business_name ?? 'Provider'} — ${cats}${where}`,
    description:
      p.bio?.slice(0, 155) ??
      `Book ${p.business_name ?? 'this pro'} on Smomo — ${cats}${where}. See portfolio, ratings and prices.`,
    alternates: { canonical: `/pro/${p.slug}` },
    openGraph: {
      title: `${p.business_name ?? 'Provider'} · Smomo`,
      images: p.portfolio[0]?.image_url ? [{ url: p.portfolio[0].image_url }] : undefined,
    },
  };
}

export default async function ProviderPage({ params }: Params) {
  const { slug } = await params;
  const p = await getProvider(slug);
  if (!p) notFound();

  const socials = SOCIAL_PLATFORMS.map((platform) => ({
    platform,
    url: socialUrl(platform, p[platform.key]),
  })).filter((s): s is { platform: (typeof SOCIAL_PLATFORMS)[number]; url: string } => s.url !== null);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    name: p.business_name ?? 'Provider',
    description: p.bio ?? undefined,
    image: p.portfolio.map((x) => x.image_url).slice(0, 5),
    address: p.base_address
      ? { '@type': 'PostalAddress', addressLocality: p.base_address, addressCountry: 'ZA' }
      : undefined,
    aggregateRating:
      p.rating != null && p.rating_count > 0
        ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.rating_count }
        : undefined,
    sameAs: socials.length ? socials.map((s) => s.url) : undefined,
    url: `${SITE_URL}/pro/${p.slug}`,
  };

  const requestHref = `/app/request/new?target=${p.id}&category=${p.categories[0] ?? ''}`;
  const photo = cardPhoto(p.avatar_url, 800);
  const name = p.business_name ?? 'Provider';

  return (
    <Container className="flex flex-col gap-5 pb-24 pt-3 sm:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="grid gap-5 lg:grid-cols-12">
        <div className="relative min-h-[360px] overflow-hidden rounded-[32px] bg-primary-200 lg:col-span-5 lg:min-h-[520px]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar name={name} size={140} />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-between gap-8 rounded-[32px] bg-primary-950 p-7 text-white sm:p-12 lg:col-span-7">
          <div>
            <div className="flex flex-wrap gap-2">
              {p.categories.map((c) => (
                <span key={c} className="rounded-full border border-primary-400 px-3 py-1 text-sm text-primary-200">
                  {CATEGORY_LABEL[CATEGORY_SLUGS[c]]}
                </span>
              ))}
            </div>
            <h1 className="mt-5 text-5xl sm:text-6xl">{name}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-primary-200">
              <span className="tnum">
                <span className="text-accent">★</span>{' '}
                {p.rating != null ? `${p.rating.toFixed(1)} · ${p.rating_count} reviews` : 'New on Smomo'}
              </span>
              <span className="tnum">{p.jobs_done} jobs done</span>
              {p.base_address ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon icon={faLocationDot} size={13} className="text-accent" /> {p.base_address}
                </span>
              ) : null}
            </div>
            {p.bio ? <p className="mt-6 max-w-xl text-lg leading-relaxed text-primary-100">{p.bio}</p> : null}
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Link href={requestHref} className="btn btn-light">
                Request a booking
              </Link>
              {socials.map(({ platform, url }) => (
                <a
                  key={platform.key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn border border-primary-400 text-white hover:bg-primary-900"
                >
                  {platform.label} <span aria-hidden>↗</span>
                </a>
              ))}
            </div>
            <p className="text-sm text-primary-300">Free to request. You&apos;ll get a price before you commit.</p>
          </div>
        </div>
      </section>

      {p.services.length > 0 ? (
        <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="services">
          <h2 id="services" className="text-3xl sm:text-4xl">Services</h2>
          <ul className="mt-5 divide-y divide-border">
            {p.services.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-4">
                <div>
                  <div className="font-medium">{s.title}</div>
                  {s.description ? <div className="text-sm text-text-muted">{s.description}</div> : null}
                </div>
                {formatZar(s.indicative_price_zar) ? (
                  <div className="tnum whitespace-nowrap rounded-full bg-primary-100 px-3 py-1 font-medium text-primary-700">
                    from {formatZar(s.indicative_price_zar)}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {p.portfolio.length > 0 ? (
        <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="work">
          <h2 id="work" className="text-3xl sm:text-4xl">Portfolio</h2>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.portfolio.map((item) => (
              <Plate key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.caption ?? `Work by ${name}`}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </Plate>
            ))}
          </div>
        </section>
      ) : null}

      {p.reviews.length > 0 ? (
        <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="reviews">
          <h2 id="reviews" className="text-3xl sm:text-4xl">What clients say</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {p.reviews.map((r, i) => (
              <figure key={i} className="rounded-[22px] bg-card-muted p-5">
                <Stars rating={r.rating} />
                {r.comment ? <blockquote className="mt-3 text-lg leading-relaxed">“{r.comment}”</blockquote> : null}
                <figcaption className="mt-3 text-sm text-text-muted">{r.reviewer_name ?? 'Client'}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col items-start justify-between gap-5 rounded-[32px] bg-primary p-7 text-white sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="text-3xl sm:text-4xl">Want to book {name}?</h2>
          <p className="mt-2 text-primary-100">Send a request and get an offer. You&apos;ll sign in or create a free account first.</p>
        </div>
        <Link href={requestHref} className="btn btn-light">
          Request a booking
        </Link>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 p-3 backdrop-blur sm:hidden">
        <Link href={requestHref} className="btn btn-primary btn-block">
          Request a booking
        </Link>
      </div>
    </Container>
  );
}
