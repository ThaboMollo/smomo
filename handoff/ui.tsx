import Link from 'next/link';
import type { ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** Hairline rule — Classical's main structural device. */
export function Hairline({ className = '' }: { className?: string }) {
  return <hr className={`hr ${className}`} />;
}

/** Small mono caps above a heading. */
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="kicker">{children}</p>;
}

/** Photographs are matted, never full-bleed banners. */
export function Plate({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`plate ${className}`}>{children}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded border border-border bg-card p-5 ${className}`}>{children}</div>
  );
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'danger';
}) {
  const tones = {
    default: 'border-border bg-card text-text-muted',
    primary: 'border-primary-300 bg-primary-100 text-primary-700',
    success: 'border-green-200 bg-green-50 text-success',
    danger: 'border-red-200 bg-red-50 text-danger',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2.5 py-0.5 text-xs ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Buttons are outlined, not filled — the primary is an accent outline that
 * tints on hover. Keeps the same props as before.
 */
export function Button({
  children,
  href,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode;
  href: string;
  variant?: 'primary' | 'outline';
  className?: string;
}) {
  const styles =
    variant === 'primary'
      ? 'border border-primary text-primary-700 hover:bg-primary-100 active:bg-primary-200'
      : 'border border-border text-text hover:bg-card-muted active:bg-border';
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded px-5 py-3 text-sm transition-colors ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  const r = Math.round(rating ?? 0);
  return (
    <span className="tnum inline-flex items-center gap-1 text-sm">
      <span className="text-star" aria-hidden>
        {'★'.repeat(r)}
        <span className="text-border">{'★'.repeat(5 - r)}</span>
      </span>
      {rating != null ? (
        <span className="text-text-muted">
          {rating.toFixed(1)}
          {count != null ? ` (${count})` : ''}
        </span>
      ) : (
        <span className="text-text-faint">New</span>
      )}
    </span>
  );
}

export function Avatar({ name, size = 48 }: { name: string | null; size?: number }) {
  const initials =
    (name ?? '?')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full border border-border bg-primary-100 font-[family-name:var(--font-heading)] text-primary-700"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}

/** Section heading with a hairline under it. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl">{title}</h2>
      {subtitle ? <p className="mt-1 text-text-muted">{subtitle}</p> : null}
      <Hairline className="mt-4" />
    </div>
  );
}
