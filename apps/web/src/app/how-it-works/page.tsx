import type { Metadata } from 'next';

import { Button, Card, Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'How Smomo connects clients with beauty, hair, nails, make-up and tattoo professionals in South Africa — post a request, get offers, book and pay via PayShap.',
};

export default function HowItWorks() {
  return (
    <Container className="py-14">
      <h1 className="text-4xl tracking-tight">How Smomo works</h1>

      <section className="mt-8">
        <h2 className="text-xl">For clients</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Post or browse', 'Post what you need with an optional photo and budget range, or browse verified pros near you.'],
            ['Get offers', 'Matching pros nearby send offers. Compare ratings, prices and portfolios, then accept one.'],
            ['Book & pay', 'Coordinate in chat, then pay the pro directly via PayShap. Verified proof of work included.'],
          ].map(([t, d]) => (
            <Card key={t}>
              <div className="font-[family-name:var(--font-heading)] text-lg text-primary-700">{t}</div>
              <p className="mt-1 text-text-muted">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl">For professionals</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['Set up your studio', 'Create your profile, list services and upload a portfolio of your work.'],
            ['Go online & get requests', 'Get verified, go online, and receive nearby client requests in real time.'],
            ['Deliver & get paid', 'Send offers, complete the job, capture proof, and get paid directly via PayShap.'],
          ].map(([t, d]) => (
            <Card key={t}>
              <div className="font-[family-name:var(--font-heading)] text-lg text-primary-700">{t}</div>
              <p className="mt-1 text-text-muted">{d}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="mt-10">
        <Button href="/tattoo-artists">Find a pro near you</Button>
      </div>
    </Container>
  );
}
