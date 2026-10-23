'use client';

import { useEffect } from 'react';

// Last-resort boundary: replaces the root layout when it (or something it renders)
// throws, so it must supply its own <html>/<body> and avoid app styles/components.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
          background: '#F4EFE7',
          color: '#251719',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Something went wrong</h1>
        <p style={{ color: '#5f5053', maxWidth: '28rem' }}>
          SMOMO hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            border: '2px solid #251719',
            color: '#251719',
            background: 'transparent',
            borderRadius: 999,
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
