import type { Metadata } from 'next';
import { Container, Button, Kicker } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You appear to be offline.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
      <Kicker>No connection</Kicker>
      <h1 className="mt-3 text-4xl">You&rsquo;re offline</h1>
      <p className="mt-4 max-w-md text-text-muted">
        Smomo can&rsquo;t reach the network right now. Check your connection and try again —
        pages you&rsquo;ve already visited will still open.
      </p>
      <div className="mt-8">
        <Button href="/">Back to home</Button>
      </div>
    </Container>
  );
}
