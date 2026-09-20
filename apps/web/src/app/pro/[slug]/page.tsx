import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SOCIAL_PLATFORMS, socialUrl } from '@smomo/shared';

import { CATEGORY_LABEL, CATEGORY_SLUGS } from '@/lib/catalog';
import { Icon } from '@/components/Icon';
import { Avatar, Badge, Button, Card, Container, Plate, Stars } from '@/components/ui';
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

  return (
    <Container className="py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex items-start gap-5">
        <Avatar name={p.business_name} size={80} />
        <div className="flex-1">
          <h1 className="text-4xl tracking-tight">{p.business_name ?? 'Provider'}</h1>
          <div className="mt-2">
            <Stars rating={p.rating} count={p.rating_count} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.categories.map((c) => (
              <Badge key={c} tone="primary">
                {CATEGORY_LABEL[CATEGORY_SLUGS[c]]}
              </Badge>
            ))}
            <Badge>{p.jobs_done} jobs</Badge>
          </div>
          {p.base_address ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-text-muted">
              <Icon icon={faLocationDot} size={14} className="text-primary-700" /> {p.base_address}
            </p>
          ) : null}
        </div>
      </div>

      {p.bio ? <p className="mt-6 max-w-2xl text-text-muted">{p.bio}</p> : null}

      {socials.length > 0 ? (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {socials.map(({ platform, url }) => (
            <a
              key={platform.key}
              href={url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary-700"
            >
              {platform.label}
              <span aria-hidden className="text-text-faint">↗</span>
            </a>
          ))}
        </div>
      ) : null}

      {p.portfolio.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-xl">Portfolio</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {p.portfolio.map((item) => (
              <Plate key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image_url}
                  alt={item.caption ?? p.business_name ?? 'Work'}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              </Plate>
            ))}
          </div>
        </section>
      ) : null}

      {p.services.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-xl">Services</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {p.services.map((s) => (
              <Card key={s.id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{s.title}</div>
                  {s.description ? <div className="text-sm text-text-muted">{s.description}</div> : null}
                </div>
                {formatZar(s.indicative_price_zar) ? (
                  <div className="tnum font-medium text-primary-700">from {formatZar(s.indicative_price_zar)}</div>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {p.reviews.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-xl">Reviews</h2>
          <div className="grid gap-3">
            {p.reviews.map((r, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.reviewer_name ?? 'Client'}</span>
                  <Stars rating={r.rating} />
                </div>
                {r.comment ? <p className="mt-2 text-text-muted">{r.comment}</p> : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-12 rounded border border-border p-8 text-center">
        <h2 className="text-xl">Want to book {p.business_name ?? 'this pro'}?</h2>
        <p className="mt-1 text-text-muted">Send a request and get an offer — right here on the web.</p>
        <div className="mt-5 flex justify-center">
          <Button href={`/app/request/new?target=${p.id}&category=${p.categories[0] ?? ''}`}>
            Request a booking
          </Button>
        </div>
        <p className="mt-3 text-sm text-text-faint">
          You&apos;ll sign in (or create a free account) to send your request.
        </p>
      </section>
    </Container>
  );
}
