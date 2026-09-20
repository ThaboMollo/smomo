import type { Metadata } from 'next';
import { Container, Button, Kicker } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Kicker>404</Kicker>
      <h1 className="mt-3 text-4xl">This page has moved on</h1>
      <p className="mt-4 max-w-md text-text-muted">
        We couldn&rsquo;t find what you were looking for. It may have been removed or the link was
        mistyped.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button href="/">Back to home</Button>
        <Button href="/tattoo-artists" variant="outline">
          Browse pros
        </Button>
      </div>
    </Container>
  );
}
