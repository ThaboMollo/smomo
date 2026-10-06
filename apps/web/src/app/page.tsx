import Image from 'next/image';
import Link from 'next/link';

import type { PublicProviderListItem } from '@smomo/shared';

import { HeroSearch } from '@/components/HeroSearch';
import { HowItWorksPanel } from '@/components/HowItWorksPanel';
import { ProviderListCard } from '@/components/ProviderListCard';
import { ArrowUpRight, Container, Kicker, Sparkle } from '@/components/ui';
import {
  CATEGORY_IMAGE,
  CATEGORY_LABEL,
  CATEGORY_NOTE,
  CATEGORY_SLUG_LIST,
  CITIES,
  titleCase,
} from '@/lib/catalog';
import { getCategoryHub } from '@/lib/public-api';

export const revalidate = 3600;

async function getFeatured(): Promise<PublicProviderListItem[]> {
  const hubs = await Promise.all(CATEGORY_SLUG_LIST.map((c) => getCategoryHub(c, 6)));
  const seen = new Set<string>();
  const all: PublicProviderListItem[] = [];
  for (const h of hubs) {
    for (const p of h?.items ?? []) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        all.push(p);
      }
    }
  }
  return all
    .sort((a, b) => (b.rating ?? 0) * Math.log2(2 + b.rating_count) - (a.rating ?? 0) * Math.log2(2 + a.rating_count))
    .slice(0, 4);
}

export default async function Home() {
  const featured = await getFeatured();
  const lead = 'hairdressers' as const;
  const rest = CATEGORY_SLUG_LIST.filter((c) => c !== lead);

  return (
    <Container className="flex flex-col gap-5 pt-3">
      {/* Hero */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="flex flex-col justify-between gap-10 rounded-[32px] bg-primary-950 p-7 text-white sm:p-12 lg:col-span-7 lg:min-h-[640px]">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-accent">
              HAIR ✦ NAILS ✦ MAKE-UP ✦ BEAUTY ✦ TATTOO
            </p>
            <h1 className="mt-6 text-[52px] leading-[0.98] sm:text-7xl xl:text-[88px]">
              Book the person, not the salon.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-primary-300">
              Verified hairdressers, nail techs, make-up artists, beauticians and tattoo artists near you. See their
              work and price, then book.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <HeroSearch />
            <p className="px-2 text-[15px] text-primary-300 sm:px-5">
              Not sure who?{' '}
              <Link href="/app/request/new" className="text-white underline underline-offset-4 hover:text-primary-200">
                Post a request
              </Link>{' '}
              and pros send you offers.
            </p>
          </div>
        </div>

        <div className="relative hidden min-h-[640px] overflow-hidden rounded-[32px] lg:col-span-5 lg:block">
          <Image
            src="/samples/hair_dresser7.jpg"
            alt="A glossy bob styled by a Smomo hairdresser"
            fill
            priority
            sizes="40vw"
            className="object-cover"
          />
          <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-medium text-text">
            <Sparkle size={14} /> ID-verified pros
          </span>
          {featured[0] ? (
            <Link
              href={`/pro/${featured[0].slug}`}
              className="absolute inset-x-5 bottom-5 flex items-center gap-3 rounded-[22px] bg-card p-3 pr-4 text-text transition-colors hover:bg-primary-100"
            >
              {featured[0].avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featured[0].avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{featured[0].business_name}</span>
                <span className="block text-sm text-text-muted">
                  <span className="text-star">★ {featured[0].rating?.toFixed(1) ?? 'New'}</span>
                  {featured[0].rating_count ? ` · ${featured[0].rating_count} reviews` : ''} · Top rated
                </span>
              </span>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-200 text-primary-700">
                <ArrowUpRight size={16} />
              </span>
            </Link>
          ) : null}
        </div>
      </section>

      {/* Categories bento */}
      <section className="rounded-[32px] bg-card p-6 sm:p-12" aria-labelledby="cats">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <Kicker>Browse by service</Kicker>
            <h2 id="cats" className="mt-3 max-w-2xl text-4xl sm:text-[56px]">
              Five crafts, one place to book them.
            </h2>
          </div>
          <p className="max-w-xs text-[15px] text-text-muted md:text-right">
            Pick a craft to see pros near you, their portfolios and starting prices.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:grid-rows-[240px_240px]">
          <Link
            href={`/${lead}`}
            className="group relative col-span-2 min-h-[300px] overflow-hidden rounded-[24px] lg:row-span-2"
          >
            <Image src={CATEGORY_IMAGE[lead]} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-primary-950/75 p-6 text-white backdrop-blur-sm">
              <div>
                <div className="font-[family-name:var(--font-heading)] text-4xl">{CATEGORY_LABEL[lead]}</div>
                <div className="mt-1 text-[15px] text-primary-200">{CATEGORY_NOTE[lead]}</div>
              </div>
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-primary-700 transition-colors group-hover:bg-primary group-hover:text-white">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </Link>
          {rest.map((c) => (
            <Link key={c} href={`/${c}`} className="group relative min-h-[220px] overflow-hidden rounded-[24px]">
              <Image src={CATEGORY_IMAGE[c]} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <div className="absolute inset-x-2.5 bottom-2.5 rounded-2xl bg-card p-3 text-text sm:inset-x-3.5 sm:bottom-3.5">
                <div className="text-sm font-medium sm:text-base">{CATEGORY_LABEL[c]}</div>
                <div className="hidden truncate text-[13px] text-text-muted sm:block">{CATEGORY_NOTE[c]}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <HowItWorksPanel />

      {/* Featured pros */}
      {featured.length > 0 ? (
        <section className="rounded-[32px] bg-card p-6 sm:p-12" aria-labelledby="featured">
          <div className="flex items-end justify-between gap-4">
            <div>
              <Kicker>Top rated</Kicker>
              <h2 id="featured" className="mt-3 text-4xl sm:text-5xl">
                Pros clients rate highest.
              </h2>
            </div>
            <Link href="/hairdressers" className="btn btn-outline hidden sm:inline-flex">
              See all pros
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <ProviderListCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Trust */}
      <section className="grid gap-5 md:grid-cols-3">
        {[
          {
            t: 'ID-verified pros',
            d: 'Every pro confirms their SA ID or passport before they can accept a booking.',
            icon: (
              <>
                <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
                <path d="M9 12l2 2 4-4" />
              </>
            ),
          },
          {
            t: 'Pay the pro directly',
            d: 'PayShap straight to your pro, deposits supported. Disputes go to our team.',
            icon: (
              <>
                <rect x="3" y="6" width="18" height="13" rx="3" />
                <path d="M3 10h18" />
                <path d="M7 15h3" />
              </>
            ),
          },
          {
            t: 'Real work, real proof',
            d: "Finished jobs flow into each pro's portfolio, so what you see is what they did.",
            icon: (
              <>
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="9" cy="10" r="2" />
                <path d="M21 16l-5-5-9 9" />
              </>
            ),
          },
        ].map(({ t, d, icon }) => (
          <div key={t} className="flex flex-col gap-3 rounded-[28px] bg-card p-8">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-200 text-primary-700">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {icon}
              </svg>
            </span>
            <h3 className="font-[family-name:var(--font-body)] text-xl font-medium tracking-normal">{t}</h3>
            <p className="text-[15px] leading-relaxed text-text-muted">{d}</p>
          </div>
        ))}
      </section>

      {/* Cities + pro CTA */}
      <section className="grid gap-5 lg:grid-cols-12">
        <div className="rounded-[32px] bg-card p-7 sm:p-11 lg:col-span-7">
          <Kicker>Popular cities</Kicker>
          <h2 className="mt-3 text-4xl sm:text-[44px]">Booked across South Africa.</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {CITIES.map((city) => (
              <Link key={city} href={`/city/${city}`} className="chip min-h-[44px] px-5 text-[15px]">
                {titleCase(city)}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[32px] bg-primary p-7 text-white sm:p-11 lg:col-span-5">
          <Sparkle size={34} />
          <div>
            <h2 className="text-4xl sm:text-[44px]">Are you a pro? Set up your studio.</h2>
            <p className="mt-3 text-primary-100/90">
              List services, upload your portfolio, go online and get requests from clients nearby.
            </p>
          </div>
          <Link href="/app/studio" className="btn btn-light self-start">
            Become a provider
          </Link>
        </div>
      </section>
    </Container>
  );
}
