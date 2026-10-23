import Link from 'next/link';

import { EditorialImage } from '@/components/landing/EditorialImage';
import { Reveal } from '@/components/landing/Reveal';
import { ASSETS, CRAFTS, ROUTES, type Tone } from '@/lib/landing-content';
import type { CategorySlug } from '@/lib/catalog';

/** Asymmetric grid: Hair leads, Tattoos closes wide. Phones get a deliberate 2-up stack. */
const PLACE: Record<CategorySlug, string> = {
  hairdressers: 'col-span-2 aspect-[5/4] md:col-span-7 md:row-span-2 md:aspect-auto',
  'nail-technicians': 'col-span-1 aspect-[4/5] md:col-span-5 md:aspect-auto',
  'makeup-artists': 'col-span-1 aspect-[4/5] md:col-span-5 md:aspect-auto',
  beauticians: 'col-span-1 aspect-[4/5] md:col-span-5 md:aspect-auto',
  'tattoo-artists': 'col-span-1 aspect-[4/5] md:col-span-7 md:aspect-auto',
};

const TEXT: Record<Tone, string> = {
  ink: 'text-canvas',
  pink: 'text-ink',
  lilac: 'text-ink',
  lime: 'text-ink',
  sand: 'text-ink',
};

export function CraftsSection() {
  return (
    <section id="explore" aria-labelledby="explore-title" className="mx-auto w-full max-w-[80rem] scroll-mt-20 px-5 py-14 sm:px-8 lg:py-24">
      <Reveal className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="label text-pink-deep">Discover your look</p>
          <h2 id="explore-title" className="d-xl mt-3">
            Whatever your look, there’s someone for it.
          </h2>
        </div>
        <p className="lead lg:col-span-4 lg:justify-self-end">Your next favourite look starts with the right person.</p>
      </Reveal>

      <ul className="mt-10 grid grid-cols-2 gap-3 md:auto-rows-[19rem] md:grid-cols-12 md:gap-4 lg:auto-rows-[23rem]">
        {CRAFTS.map((c, i) => {
          const asset = ASSETS[c.asset];
          return (
            <Reveal as="li" key={c.slug} delay={i * 70} className={PLACE[c.slug]}>
              <Link
                href={ROUTES.category(c.slug)}
                aria-label={`${c.name}: ${c.line}`}
                className={`tile group relative block h-full w-full overflow-hidden rounded-[1.5rem] md:rounded-[2rem] ${asset.src ? 'text-canvas' : TEXT[asset.tone]}`}
              >
                <EditorialImage asset={asset} sizes="(min-width: 1024px) 40vw, 50vw" />
                {asset.src ? <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/15 to-transparent" /> : null}
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 md:p-6">
                  <span className="min-w-0">
                    <span className="label block opacity-80">0{i + 1}</span>
                    <span className="d-md mt-1 block font-[family-name:var(--font-display)] whitespace-nowrap text-[clamp(1.375rem,5.4vw,2.75rem)] font-bold leading-none tracking-[-0.04em]">
                      <span className="u-link">{c.name}</span>
                    </span>
                    <span className="mt-2 hidden max-w-[24ch] text-[0.9375rem] leading-snug sm:block">{c.line}</span>
                  </span>
                  <span
                    aria-hidden
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-base text-ink transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 md:h-12 md:w-12 md:text-lg"
                  >
                    ↗
                  </span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </section>
  );
}
