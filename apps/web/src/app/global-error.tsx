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
          fontFamily: 'Georgia, serif',
          background: '#faf9fc',
          color: '#1a1523',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <h1 style={{ fontSize: '2rem', margin: 0 }}>Something went wrong</h1>
        <p style={{ color: '#5c5568', maxWidth: '28rem' }}>
          Smomo hit an unexpected error. Please try again.
        </p>
        <button
          onClick={reset}
          style={{
            border: '1px solid #6d28d9',
            color: '#5b21b6',
            background: 'transparent',
            borderRadius: 4,
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
