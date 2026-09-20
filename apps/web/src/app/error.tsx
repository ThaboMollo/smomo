'use client';

import { useEffect } from 'react';
import { Container, Kicker } from '@/components/ui';

// Route-segment error boundary. Keep it dependency-light so it renders even when
// something in the tree below is broken.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in Vercel runtime logs; wire an error reporter here if desired.
    console.error(error);
  }, [error]);

  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Kicker>Something went wrong</Kicker>
      <h1 className="mt-3 text-4xl">We hit a snag</h1>
      <p className="mt-4 max-w-md text-text-muted">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded border border-primary px-5 py-3 text-sm text-primary-700 transition-colors hover:bg-primary-100"
        >
          Try again
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded border border-border px-5 py-3 text-sm text-text transition-colors hover:bg-card-muted"
        >
          Back to home
        </a>
      </div>
    </Container>
  );
}
