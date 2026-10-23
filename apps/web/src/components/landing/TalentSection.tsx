import Link from 'next/link';
import { Suspense } from 'react';

import { Reveal } from '@/components/landing/Reveal';
import { SmomoMark } from '@/components/landing/SmomoMark';
import { CATEGORY_LABEL, CATEGORY_SLUGS, CATEGORY_SLUG_LIST } from '@/lib/catalog';
import { cardPhoto } from '@/lib/images';
import { getTalentPreview } from '@/lib/landing-data';
import { CRAFTS, ROUTES } from '@/lib/landing-content';
import type { PublicProviderListItem } from '@smomo/shared';

const NAME = Object.fromEntries(CRAFTS.map((c) => [c.slug, c.name]));

/**
 * Live provider preview from the public API. Only fields the platform returns are shown.
 * Ratings, review counts and "jobs done" are intentionally left out of this marketing
 * surface until review integrity is confirmed (the current listings include seed
 * accounts). Price shows only when a starting price exists.
 */
function TalentCard({ p }: { p: PublicProviderListItem }) {
  const photo = cardPhoto(p.avatar_url);
  const crafts = p.categories.map((c) => NAME[CATEGORY_SLUGS[c]] ?? CATEGORY_LABEL[CATEGORY_SLUGS[c]]).join(' · ');
  const name = p.business_name ?? 'SMOMO creator';
  return (
    <li>
      <Link
        href={`/pro/${p.slug}`}
        className="tile group flex h-full flex-col overflow-hidden rounded-[1.5rem] border-2 border-ink bg-white transition-colors hover:bg-lilac/40"
      >
        <span className="relative block aspect-[4/5] overflow-hidden bg-ink/5">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" width={640} height={736} className="h-full w-full object-cover" />
          ) : (
            <span className="ph" data-tone="lilac" aria-hidden>
              <SmomoMark size="md" className="ph-mark" />
            </span>
          )}
        </span>
        <span className="flex flex-1 flex-col gap-1 p-4">
          <span className="font-[family-name:var(--font-display)] text-xl font-bold leading-tight tracking-[-0.03em]">{name}</span>
          <span className="text-[0.9375rem] text-ink/75">{crafts}</span>
          {p.min_price != null ? (
            <span className="text-[0.9375rem] font-medium">From R{Number(p.min_price).toLocaleString('en-ZA')}</span>
          ) : null}
          <span className="mt-auto pt-3 text-[0.9375rem] font-bold">
            <span className="u-link">View their work</span> <span aria-hidden>↗</span>
          </span>
        </span>
      </Link>
    </li>
  );
}

/** One row on desktop whenever the count allows it, so a short list never leaves an orphan row. */
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
  6: 'lg:grid-cols-3',
};

async function TalentGrid() {
  const { items, failed } = await getTalentPreview(6);

  if (items.length === 0) {
    return (
      <div className="mt-10 rounded-[1.75rem] border-2 border-dashed border-ink/40 p-8 text-center sm:p-12">
        <SmomoMark className="mx-auto h-10 text-pink" />
        <p className="d-md mt-4 font-[family-name:var(--font-display)] font-bold">
          {failed ? 'We couldn’t load creators right now.' : 'No creators listed just yet.'}
        </p>
        <p className="mx-auto mt-2 max-w-md text-ink/75">
          {failed
            ? 'Browse by craft instead, or try again in a moment.'
            : 'Browse by craft, or be one of the first to show your work on SMOMO.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={ROUTES.category('hairdressers')} className="sm-btn sm-btn--ink">
            Browse by craft
          </Link>
          <Link href={ROUTES.joinAsPro} className="sm-btn sm-btn--line">
            Join as a Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ul className={`mt-10 grid grid-cols-2 gap-3 md:gap-4 ${LG_COLS[Math.min(items.length, 6)]}`}>
      {items.map((p) => (
        <TalentCard key={p.id} p={p} />
      ))}
    </ul>
  );
}

function TalentSkeleton() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="aspect-[4/6] animate-pulse rounded-[1.5rem] bg-ink/10" />
      ))}
    </div>
  );
}

export function TalentSection() {
  return (
    <section id="talent" aria-labelledby="talent-title" className="mx-auto w-full max-w-[80rem] scroll-mt-20 px-5 py-14 sm:px-8 lg:py-24">
      <Reveal className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <p className="label text-pink-deep">Find your person</p>
          <h2 id="talent-title" className="d-xl mt-3">
            Talent worth finding.
          </h2>
          <p className="lead mt-5">Explore professionals, discover their work and find someone who fits your vision.</p>
        </div>
        <Link href={ROUTES.discover} className="sm-btn sm-btn--ink self-start lg:self-auto">
          Explore All Talent
          <span aria-hidden className="arrow">
            ↗
          </span>
        </Link>
      </Reveal>

      <Suspense fallback={<TalentSkeleton />}>
        <TalentGrid />
      </Suspense>

      <nav aria-label="Browse by craft" className="mt-8 flex flex-wrap gap-2">
        {CATEGORY_SLUG_LIST.map((c) => (
          <Link key={c} href={ROUTES.category(c)} className="inline-flex min-h-11 items-center rounded-full border-2 border-ink px-5 text-[0.9375rem] font-bold transition-colors hover:bg-ink hover:text-canvas">
            {NAME[c]}
          </Link>
        ))}
      </nav>
    </section>
  );
}
