import Link from 'next/link';
import Image from 'next/image';

import { Button, Card, Container, Hairline, Kicker } from '@/components/ui';
import { CategoryIcon } from '@/components/CategoryIcon';
import { CATEGORY_LABEL, CATEGORY_SLUG_LIST, CITIES, titleCase } from '@/lib/catalog';

const CATEGORY_NOTE: Record<string, string> = {
  'hairdressers': 'Braids, silk presses, cuts and colour',
  'nail-technicians': 'Gel, BIAB and structured manicures',
  'makeup-artists': 'Bridal, editorial and event looks',
  'beauticians': 'Facials, lashes and skin treatments',
  'tattoo-artists': 'Fine-line, blackwork and cover-ups',
};

export default function Home() {
  return (
    <>
      {/* Hero — the brand mark on the deep violet, beside the promise */}
      <Container className="grid items-center gap-10 py-16 md:grid-cols-2">
        <div>
          <Kicker>Hair ✦ Nails ✦ Make-up ✦ Beauty ✦ Tattoo</Kicker>
          <h1 className="mt-4 text-4xl sm:text-5xl">Book the person, not the salon.</h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-text-muted">
            Hairdressers, nail technicians, make-up artists, beauticians and tattoo artists near you.
            See their work, see the price, book the slot — or post a request and let offers come to you.
          </p>
          <Hairline className="my-8" />
          <div className="flex flex-wrap gap-3">
            <Button href="/tattoo-artists">Explore pros</Button>
            <Button href="/how-it-works" variant="outline">
              How it works
            </Button>
          </div>
        </div>
        <div className="plate">
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-7 bg-primary-900 p-8">
            <Image
              src="/assets/Smomo_logo_dark.png"
              alt="Smomo"
              width={340}
              height={133}
              priority
              className="w-full max-w-sm"
            />
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-accent">
              Booked across South Africa
            </p>
          </div>
        </div>
      </Container>

      {/* Categories */}
      <Container className="py-8">
        <h2 className="text-2xl">Browse by service</h2>
        <Hairline className="mb-6 mt-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_SLUG_LIST.map((c) => (
            <Link key={c} href={`/${c}`}>
              <Card className="h-full transition-colors hover:bg-primary-100">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={c} size={22} />
                  <div className="font-[family-name:var(--font-heading)] text-xl">
                    {CATEGORY_LABEL[c]}
                  </div>
                </div>
                <p className="mt-2 text-sm text-text-muted">{CATEGORY_NOTE[c] ?? ''}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Container>

      {/* How it works — numbered, hairline-parted columns */}
      <Container className="py-14">
        <h2 className="text-2xl">How Smomo works</h2>
        <Hairline className="mb-2 mt-4" />
        <div className="grid sm:grid-cols-3">
          {[
            ['01', 'Post or browse', 'Tell pros what you need, with a photo and a budget, or browse those near you.'],
            ['02', 'Get offers', 'Verified pros nearby send you offers. Pick the one you like.'],
            ['03', 'Book & pay', 'Chat to arrange the details and pay the deposit by PayShap.'],
          ].map(([n, t, d]) => (
            <div key={n} className="border-border py-6 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0">
              <span className="tnum font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-primary-700">
                {n}
              </span>
              <h3 className="mt-2 text-xl">{t}</h3>
              <p className="mt-2 leading-relaxed text-text-muted">{d}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Cities */}
      <Container className="pb-20">
        <h2 className="text-2xl">Popular cities</h2>
        <Hairline className="mb-6 mt-4" />
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <Link
              key={city}
              href={`/city/${city}`}
              className="rounded border border-border px-4 py-2 text-sm transition-colors hover:bg-primary-100"
            >
              {titleCase(city)}
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
