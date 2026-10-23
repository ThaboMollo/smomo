import { getImageProps } from 'next/image';

import { EditorialImage } from '@/components/landing/EditorialImage';
import { HeroFinder } from '@/components/landing/HeroFinder';
import { ASSETS } from '@/lib/landing-content';

/**
 * Art-directed hero photograph: the portrait crop on phones, the wide crop with copy room
 * from 1024px. One <picture>, one download, high priority. Falls back to labelled
 * placeholders if either source is missing.
 */
function HeroPhoto() {
  const d = ASSETS.heroDesktop;
  const m = ASSETS.heroMobile;
  if (d.src && m.src) {
    const base = { fill: true, loading: 'eager', fetchPriority: 'high', quality: 80 } as const;
    const desktop = getImageProps({ ...base, src: d.src, alt: d.alt, sizes: '(min-width: 1344px) 1344px, 100vw' });
    const mobile = getImageProps({ ...base, src: m.src, alt: m.alt, sizes: '100vw' });
    return (
      <picture>
        <source media="(min-width: 1024px)" srcSet={desktop.props.srcSet} sizes={desktop.props.sizes} />
        {/* eslint-disable-next-line jsx-a11y/alt-text -- alt is spread from getImageProps */}
        <img {...mobile.props} className="object-cover object-[50%_10%] lg:object-[100%_30%]" />
      </picture>
    );
  }
  return (
    <>
      <EditorialImage asset={m} sizes="100vw" className="lg:hidden" />
      <EditorialImage asset={d} sizes="100vw" className="hidden lg:block" />
    </>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="px-3 pb-4 pt-1 sm:px-5 lg:pb-8">
      <div className="on-ink relative mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] bg-ink text-canvas sm:rounded-[2.75rem]">
        {/* Photograph: top block on phones (fading into the ink), full-bleed behind the copy on desktop. */}
        <div className="relative aspect-[4/5] sm:aspect-[16/11] lg:absolute lg:inset-0 lg:aspect-auto">
          <HeroPhoto />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink to-transparent lg:hidden" />
        </div>

        <div className="relative z-10 -mt-24 flex flex-col gap-6 px-5 pb-10 sm:-mt-32 sm:px-10 lg:mt-0 lg:min-h-[40rem] lg:max-w-[52%] lg:justify-center lg:gap-7 lg:px-14 lg:py-16">
          <p className="label fade-in text-lime" style={{ '--d': '0ms' } as React.CSSProperties}>
            Hair / Nails / Make-up / Beauty / Ink
          </p>

          <h1 id="hero-title" className="d-hero">
            <span className="rise-mask">
              <span>Your look.</span>
            </span>
            <span className="rise-mask">
              <span style={{ '--d': '110ms' } as React.CSSProperties}>
                Your <span className="text-pink">people.</span>
              </span>
            </span>
          </h1>

          <p className="lead text-canvas/90">
            Find the people who make your look happen. Discover independent hair, nail, beauty, make-up and tattoo
            professionals who get your vision.
          </p>

          <div className="fade-in max-w-[36rem]" style={{ '--d': '380ms' } as React.CSSProperties}>
            <HeroFinder />
            <p className="mt-4 text-[0.9375rem] font-medium text-canvas/80">Great looks don’t happen alone.</p>
          </div>
        </div>

        <span
          aria-hidden
          className="absolute right-5 top-5 z-10 rotate-6 rounded-full bg-lime px-4 py-2 text-[0.8125rem] font-bold uppercase tracking-[0.1em] text-ink sm:right-8 sm:top-8"
        >
          Made by someone.
        </span>
      </div>
    </section>
  );
}
