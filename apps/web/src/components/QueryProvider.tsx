'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { GlobalLoadingOverlay } from '@/components/GlobalLoadingOverlay';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      {children}
      {/* One spinner for the whole signed-in app; see GlobalLoadingOverlay for what counts. */}
      <GlobalLoadingOverlay />
    </QueryClientProvider>
  );
}
