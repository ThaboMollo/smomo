import Link from 'next/link';
import type { ReactNode } from 'react';

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

/** Hairline rule. */
export function Hairline({ className = '' }: { className?: string }) {
  return <hr className={`hr ${className}`} />;
}

/** Small mono caps above a heading, led by a dot. */
export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`kicker inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </p>
  );
}

/** Rounded photo frame. */
export function Plate({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`plate ${className}`}>{children}</div>;
}

/** The brand's four-point sparkle, in rose gold by default. */
export function Sparkle({ size = 16, className = 'text-accent' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 0C12.6 7 17 11.4 24 12C17 12.6 12.6 17 12 24C11.4 17 7 12.6 0 12C7 11.4 11.4 7 12 0Z" />
    </svg>
  );
}

/** Diagonal arrow used on bento tiles. */
export function ArrowUpRight({ size = 18, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[24px] border border-border bg-card p-5 ${className}`}>{children}</div>;
}

export function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'primary' | 'success' | 'danger';
}) {
  const tones = {
    default: 'border-border bg-card-muted text-text-muted',
    primary: 'border-primary-300 bg-primary-100 text-primary-700',
    success: 'border-green-200 bg-green-50 text-success dark:border-green-900 dark:bg-green-950',
    danger: 'border-red-200 bg-red-50 text-danger dark:border-red-900 dark:bg-red-950',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/** Pill button rendered as a link. Primary is filled violet; outline is quiet. */
export function Button({
  children,
  href,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode;
  href: string;
  variant?: 'primary' | 'outline' | 'light';
  className?: string;
}) {
  const styles = { primary: 'btn-primary', outline: 'btn-outline', light: 'btn-light' }[variant];
  return (
    <Link href={href} className={`btn ${styles} ${className}`}>
      {children}
    </Link>
  );
}

export function Stars({ rating, count }: { rating: number | null; count?: number }) {
  if (rating == null) {
    return <span className="text-sm text-text-faint">New</span>;
  }
  return (
    <span className="tnum inline-flex items-center gap-1 text-sm">
      <span className="text-star" aria-hidden>
        ★
      </span>
      <span className="font-medium text-text">{rating.toFixed(1)}</span>
      {count != null ? <span className="text-text-muted">({count})</span> : null}
      <span className="sr-only">out of 5 stars</span>
    </span>
  );
}

export function Avatar({
  name,
  size = 48,
  src,
  className = '',
}: {
  name: string | null;
  size?: number;
  src?: string | null;
  className?: string;
}) {
  const initials =
    (name ?? '?')
      .split(' ')
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
        loading="lazy"
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary-200 font-medium text-primary-700 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {initials}
    </div>
  );
}

/** Section heading. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-2 text-text-muted">{subtitle}</p> : null}
    </div>
  );
}

/** Labelled form field. The label wraps the control so clicking it focuses the input. */
export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span className="font-medium text-text">{label}</span>
      {children}
      {error ? (
        <span className="text-sm text-danger" role="alert">
          {error}
        </span>
      ) : hint ? (
        <span className="text-sm text-text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

/** Thin progress bar for multi-step flows. */
export function Steps({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div className="flex items-center gap-3" aria-label={`Step ${step} of ${total}`}>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-primary' : 'bg-border'}`}
          />
        ))}
      </div>
      <span className="whitespace-nowrap text-sm text-text-muted">
        Step {step} of {total}
        {label ? ` · ${label}` : ''}
      </span>
    </div>
  );
}

/** Friendly empty state with an optional action. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-primary-300 bg-card px-6 py-10 text-center">
      <Sparkle size={22} />
      <p className="text-lg font-medium">{title}</p>
      {body ? <p className="max-w-sm text-sm text-text-muted">{body}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Loading placeholder rows. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[20px] bg-primary-100 ${className}`} />;
}
