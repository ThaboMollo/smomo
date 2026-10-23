/**
 * The official SMOMO symbol: the approved white flower with the S as a negative-space
 * knockout. It is the approved artwork (public/brand/smomo-symbol-*.webp) used as an
 * alpha mask, so it takes any flat brand colour from `currentColor` without being
 * redrawn, outlined, shadowed or distorted. Size it with height or width; the aspect
 * ratio is fixed.
 */
export function SmomoMark({
  className = '',
  size = 'sm',
  label,
}: {
  className?: string;
  /** Which mask resolution to load: sm ≤ 128px wide, md ≤ 320px, lg for large graphics. */
  size?: 'sm' | 'md' | 'lg';
  /** Accessible name. Omit when the mark is decorative or sits beside the wordmark. */
  label?: string;
}) {
  const cls = size === 'lg' ? 'smomo-mark smomo-mark--lg' : size === 'md' ? 'smomo-mark smomo-mark--md' : 'smomo-mark';
  return (
    <span
      className={`${cls} ${className}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    />
  );
}

/** Symbol + lowercase `smomo` wordmark as one coordinated lockup. */
export function SmomoLockup({ className = '', markClassName = 'h-9' }: { className?: string; markClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-[0.55em] ${className}`}>
      <SmomoMark className={markClassName} />
      <span className="smomo-wordmark text-[1.75rem] leading-none">smomo</span>
    </span>
  );
}
