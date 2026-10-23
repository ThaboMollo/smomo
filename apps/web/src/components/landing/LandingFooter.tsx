import Link from 'next/link';

import { COUNTRY_LIST } from '@smomo/shared';

import { SmomoLockup } from '@/components/landing/SmomoMark';
import { CRAFTS, ROUTES } from '@/lib/landing-content';

const colHead = 'label text-canvas/65';
const link = 'inline-block py-1 text-[1.0625rem] font-medium text-canvas';

/**
 * Footer. Only real routes are linked. There are no Privacy, Terms or support pages and no
 * verified contact details or social profiles in the product yet, so they are listed as
 * pending (plain text, not links) rather than pointed at pages that don't exist.
 * They must be published before launch.
 */
export function LandingFooter() {
  return (
    <footer className="on-ink mt-14 overflow-hidden bg-ink text-canvas lg:mt-24">
      <div className="mx-auto w-full max-w-[80rem] px-5 pt-14 sm:px-8 lg:pt-20">
        <div className="grid gap-12 md:grid-cols-3 lg:grid-cols-12">
          <div className="md:col-span-3 lg:col-span-5">
            <Link href="/" aria-label="SMOMO home" className="inline-block text-canvas">
              <SmomoLockup markClassName="h-10" />
            </Link>
            <p className="d-md mt-6 max-w-[20ch] font-[family-name:var(--font-display)] font-bold tracking-[-0.04em]">The people behind your look.</p>
            <p className="mt-3 max-w-[38ch] text-canvas/75">Hair, nails, make-up, beauty and tattoo professionals across Southern Africa.</p>
          </div>

          <nav aria-label="Explore services" className="lg:col-span-2">
            <p className={colHead}>Explore</p>
            <ul className="mt-3">
              {CRAFTS.map((c) => (
                <li key={c.slug}>
                  <Link href={ROUTES.category(c.slug)} className={link}>
                    <span className="u-link">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="SMOMO" className="lg:col-span-2">
            <p className={colHead}>SMOMO</p>
            <ul className="mt-3">
              <li>
                <Link href={ROUTES.howItWorks} className={link}>
                  <span className="u-link">How It Works</span>
                </Link>
              </li>
              <li>
                <Link href={ROUTES.forPros} className={link}>
                  <span className="u-link">For Professionals</span>
                </Link>
              </li>
              <li>
                <Link href={ROUTES.download} className={link}>
                  <span className="u-link">Get the app</span>
                </Link>
              </li>
              <li>
                <Link href={ROUTES.login} className={link}>
                  <span className="u-link">Log In</span>
                </Link>
              </li>
              <li>
                <Link href={ROUTES.register} className={link}>
                  <span className="u-link">Join SMOMO</span>
                </Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <p className={colHead}>Support and legal</p>
            <ul className="mt-3 text-[1.0625rem] text-canvas/70">
              {['Contact and support', 'Privacy Policy', 'Terms'].map((t) => (
                <li key={t} className="py-1">
                  {t} <span className="whitespace-nowrap text-[0.8125rem]">(to be published)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav aria-label="Browse by country and city" className="mt-12 border-t border-canvas/20 pt-6">
          <p className={colHead}>Browse by country</p>
          <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-6">
            {COUNTRY_LIST.map((c) => (
              <li key={c.code}>
                <Link href={`/country/${c.slug}`} className="inline-block text-[1.0625rem] font-bold text-canvas">
                  <span className="u-link">{c.name}</span>
                </Link>
                <ul className="mt-2 space-y-0.5">
                  {c.cities.slice(0, 4).map((city) => (
                    <li key={city.slug}>
                      <Link href={ROUTES.city(city.slug)} className="inline-block py-1 text-[0.9375rem] text-canvas/80 hover:text-canvas">
                        <span className="u-link">{city.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-10 text-[0.9375rem] text-canvas/70">© {new Date().getFullYear()} SMOMO.</p>
      </div>

      {/* Oversized wordmark: decorative, so hidden from assistive tech and the tab order. */}
      <p
        aria-hidden
        className="smomo-wordmark pointer-events-none mt-6 select-none whitespace-nowrap text-center text-[min(29vw,26rem)] leading-[0.74] text-canvas/95"
        style={{ marginBottom: '-0.12em' }}
      >
        smomo
      </p>
    </footer>
  );
}
