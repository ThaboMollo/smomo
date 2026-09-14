import Link from 'next/link';

import { Button, Card, Container } from '@/components/ui';
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_SLUG_LIST, CITIES, titleCase } from '@/lib/catalog';

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-primary-soft">
        <Container className="py-20 text-center">
          <p className="text-4xl">💅✨🖋️</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            Beauty & body-service pros, booked to you.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-text-muted">
            Hairdressers, nail technicians, make-up artists, beauticians and tattoo artists near you.
            Browse pros, post a request, and get offers — inDrive-style.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/tattoo-artists">Explore pros</Button>
            <Button href="/how-it-works" variant="outline">
              How it works
            </Button>
          </div>
        </Container>
      </section>

      {/* Categories */}
      <Container className="py-14">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Browse by service</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORY_SLUG_LIST.map((c) => (
            <Link key={c} href={`/${c}`}>
              <Card className="text-center transition-shadow hover:shadow-md">
                <div className="text-3xl">{CATEGORY_EMOJI[c]}</div>
                <div className="mt-2 font-semibold">{CATEGORY_LABEL[c]}</div>
              </Card>
            </Link>
          ))}
        </div>
      </Container>

      {/* How it works */}
      <section className="bg-card-muted">
        <Container className="py-14">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">How Smomo works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ['1. Post or browse', 'Tell pros what you need (with a photo & budget), or browse those near you.'],
              ['2. Get offers', 'Verified pros nearby send you offers. Pick the one you like.'],
              ['3. Book & pay', 'Chat to arrange details and pay securely via PayShap.'],
            ].map(([t, d]) => (
              <Card key={t}>
                <div className="text-lg font-bold text-primary">{t}</div>
                <p className="mt-1 text-text-muted">{d}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Cities */}
      <Container className="py-14">
        <h2 className="mb-6 text-2xl font-bold tracking-tight">Popular cities</h2>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((city) => (
            <Link
              key={city}
              href={`/city/${city}`}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-card-muted"
            >
              {titleCase(city)}
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
