import type { Metadata } from 'next';
import Link from 'next/link';

import { HowItWorksPanel } from '@/components/HowItWorksPanel';
import { PageHero } from '@/components/PageHero';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How Smomo connects clients with beauty, hair, nails, make-up and tattoo professionals in South Africa: post a request, get offers, book and pay via PayShap.',
};

const FAQ = [
  ['Is it free to post a request?', 'Yes. You only pay the pro you choose, directly, by PayShap.'],
  ['How are pros verified?', 'Pros confirm their SA ID (checked with the Luhn rule) or passport before they can accept bookings.'],
  ['What if something goes wrong with a payment?', 'Payments are recorded in the app. If a pro disputes one, it goes to the Smomo admin team.'],
  ['Can the pro come to me?', 'Many do. Choose "They come to me" or "At their studio" when you post a request or browse.'],
];

export default function HowItWorks() {
  return (
    <Container className="flex flex-col gap-5 pt-3">
      <PageHero
        crumbs={[{ href: '/', label: 'Home' }, { label: 'How it works' }]}
        title="How Smomo works"
        subtitle="One place to find, compare and book beauty and body-art pros, whether you want to browse or let offers come to you."
        image="/samples/nail_tech6.jpg"
      />
      <HowItWorksPanel initial="clients" />
      <div id="pros" className="scroll-mt-24">
        <HowItWorksPanel initial="pros" />
      </div>
      <section className="rounded-[32px] bg-card p-6 sm:p-10" aria-labelledby="faq">
        <h2 id="faq" className="text-3xl sm:text-4xl">
          Good to know
        </h2>
        <div className="mt-5 divide-y divide-border">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {q}
                <span aria-hidden className="text-2xl text-primary-700 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-2 max-w-2xl text-text-muted">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/app/request/new" className="btn btn-primary">
            Post a request
          </Link>
          <Link href="/hairdressers" className="btn btn-outline">
            Browse pros
          </Link>
        </div>
      </section>
    </Container>
  );
}
