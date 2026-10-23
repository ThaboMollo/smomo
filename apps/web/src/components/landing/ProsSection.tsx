import Link from 'next/link';

import { EditorialImage } from '@/components/landing/EditorialImage';
import { Reveal } from '@/components/landing/Reveal';
import { ASSETS, PRO_BENEFITS, ROUTES } from '@/lib/landing-content';

/**
 * Provider acquisition. Benefits are limited to what the product does today.
 * No claim about cost, earnings or guaranteed bookings is made.
 */
export function ProsSection() {
  return (
    <section id="pros" aria-labelledby="pros-title" className="scroll-mt-20 px-3 sm:px-5">
      <div className="on-ink mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] bg-ink text-canvas sm:rounded-[2.75rem]">
        <div className="grid lg:grid-cols-12">
          <div className="px-5 py-14 sm:px-10 lg:col-span-6 lg:px-16 lg:py-24">
            <Reveal>
              <p className="label text-lime">For the creators</p>
              <h2 id="pros-title" className="d-xl mt-3">
                Your craft deserves a bigger stage.
              </h2>
              <p className="lead mt-5 text-canvas/85">
                Your skills. Your portfolio. Your business. Connect with people looking for what you do.
              </p>
            </Reveal>

            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {PRO_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-3 text-[1.0625rem] font-medium">
                  <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime text-ink">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href={ROUTES.joinAsPro} className="sm-btn sm-btn--pink">
                Join as a Pro
                <span aria-hidden className="arrow">
                  ↗
                </span>
              </Link>
              <Link href={ROUTES.loginAsPro} className="text-[0.9375rem] font-medium">
                Already on SMOMO? <span className="u-link font-bold">Open your studio</span>
              </Link>
            </div>
          </div>

          <div className="relative min-h-[20rem] lg:col-span-6 lg:min-h-0">
            <EditorialImage asset={ASSETS.proRecruitment} sizes="(min-width: 1024px) 50vw, 100vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
