import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { LoadingOverlay } from '@/components/SmomoSpinner';

/**
 * How long a request has to be in flight before the overlay appears. Anything that
 * answers faster than this never covers the screen, which is what stops the spinner
 * strobing on a quick cache miss.
 */
const DELAY_MS = 250;

/**
 * Counts the API work that should take the screen over.
 *
 * Deliberately not every fetch: a background refetch of data already on screen must not
 * black out a screen the person is reading. So this counts first loads — a query with
 * nothing cached yet — plus every mutation, since a write should block input until it
 * lands and cannot be double-submitted.
 */
function useBlockingRequestCount() {
  const firstLoads = useIsFetching({
    predicate: (query) => query.state.data === undefined && query.state.fetchStatus === 'fetching',
  });
  const mutations = useIsMutating();
  return firstLoads + mutations;
}

/**
 * The app-wide loading spinner. Mounted once under `<QueryClientProvider>` in the root
 * layout, so every screen gets the full-screen SMOMO spinner while its data or its
 * writes are in flight, with no per-screen wiring.
 */
export function GlobalLoadingOverlay() {
  const pending = useBlockingRequestCount();
  // The count as of `DELAY_MS` ago. Only appearing is delayed — the overlay goes away the
  // moment the work finishes, which falls out of the `!pending` test below rather than
  // needing its own state.
  const settled = useDelayed(pending);

  if (!pending || !settled) return null;
  return <LoadingOverlay />;
}

function useDelayed(pending: number) {
  const [settled, setSettled] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setSettled(pending), pending ? DELAY_MS : 0);
    return () => clearTimeout(t);
  }, [pending]);
  return settled;
}
