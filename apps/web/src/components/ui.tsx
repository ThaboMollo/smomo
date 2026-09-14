import Link from 'next/link';
import type { ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>{children}</div>
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
    default: 'bg-card-muted text-text-muted',
    primary: 'bg-primary-soft text-primary',
    success: 'bg-green-100 text-success',
    danger: 'bg-red-100 text-danger',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

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
      ? 'bg-primary text-white hover:bg-primary-dark'
      : 'border border-border bg-card text-text hover:bg-card-muted';
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition-colors ${styles} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  const r = Math.round(rating ?? 0);
  return (
    <span className="inline-flex items-center gap-1 text-sm">
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
      className="flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-1 text-text-muted">{subtitle}</p> : null}
    </div>
  );
}
