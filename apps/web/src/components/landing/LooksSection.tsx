import Link from 'next/link';

import { EditorialImage } from '@/components/landing/EditorialImage';
import { Reveal } from '@/components/landing/Reveal';
import { LOOK_TILES, ROUTES } from '@/lib/landing-content';

/**
 * "Looks worth saving": editorial brand photography per craft, each linking to that craft's
 * listing. These are campaign images, not any one provider's portfolio, so they carry no
 * attribution. Real portfolio images (with credit and a profile link) can replace them once
 * providers' work is approved. No save counts, likes or social proof are shown because the
 * platform has none.
 */
export function LooksSection() {
  return (
    <section aria-labelledby="looks-title" className="mx-auto w-full max-w-[80rem] px-5 py-14 sm:px-8 lg:py-24">
      <Reveal className="max-w-3xl">
        <p className="label text-pink-deep">Looks worth saving</p>
        <h2 id="looks-title" className="d-xl mt-3">
          See it. Love it. Find your person.
        </h2>
        <p className="lead mt-5">Start with a craft, see the work, then meet the people who make it.</p>
      </Reveal>

      <ul className="mt-10 columns-2 gap-3 md:gap-4 lg:columns-3 [&>li]:mb-3 md:[&>li]:mb-4">
        {LOOK_TILES.map((t, i) => (
          <Reveal as="li" key={t.id} delay={(i % 3) * 70} className="break-inside-avoid">
            <Link
              href={ROUTES.category(t.craft)}
              aria-label={`See ${t.label.toLowerCase()} pros`}
              className="tile group relative block overflow-hidden rounded-[1.25rem] md:rounded-[1.75rem]"
              style={{ aspectRatio: t.ratio }}
            >
              <EditorialImage
                asset={{ id: t.id, brief: `${t.label} look`, alt: t.alt, tone: t.tone, src: t.src, focal: t.focal }}
                sizes="(min-width: 1024px) 26vw, 50vw"
              />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-canvas px-3 py-1.5 text-[0.8125rem] font-bold text-ink">
                {t.label}
                <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  ↗
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
