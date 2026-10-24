import type { ReactNode } from 'react';

import { SmomoMark } from '@/components/landing/SmomoMark';

const HEIGHT = { sm: 'h-6', md: 'h-10', lg: 'h-16' } as const;

/**
 * The SMOMO loading spinner: the official symbol turning in place.
 *
 * It is the approved artwork used as an alpha mask (see `.smomo-mark`), so it takes its
 * colour from `currentColor` and is only rotated — never redrawn or distorted. Use this
 * inline, inside a button or a panel; for a whole-page wait use `<LoadingOverlay>`.
 */
export function SmomoSpinner({
  size = 'md',
  className = '',
  label = 'Loading',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Accessible name. Pass `null` when something nearby already announces the wait. */
  label?: string | null;
}) {
  return (
    <span
      className={`inline-flex ${className}`}
      {...(label ? { role: 'status', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <SmomoMark className={`${HEIGHT[size]} smomo-spin`} size={size === 'lg' ? 'md' : 'sm'} />
    </span>
  );
}

/**
 * Full-screen wait: the spinner centred on the themed page ground at a faint opacity, so
 * what is behind stays visible but out of reach. `--color-bg` is swapped by the
 * `data-theme` attribute, which is how this follows light and dark with no extra work.
 *
 * Mounted globally by `<GlobalLoadingOverlay>`; render it directly only for a wait that
 * React Query does not drive (a redirect, a file read, a hand-rolled fetch).
 */
export function LoadingOverlay({ label = 'Loading…', children }: { label?: string; children?: ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="smomo-overlay fixed inset-0 z-[100] grid place-items-center bg-bg/70 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-4 text-primary">
        <SmomoSpinner size="lg" label={null} />
        {children ?? <span className="sr-only">{label}</span>}
      </div>
    </div>
  );
}
