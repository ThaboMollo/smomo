import { SmomoLockup } from '@/components/landing/SmomoMark';

/**
 * The SMOMO lockup: the approved flower-and-S symbol beside the lowercase wordmark.
 * It takes its colour from the surrounding text colour, so it works on any ground.
 * Pass the height as the mark's size, e.g. "h-9 w-auto".
 */
export function BrandLogo({ className = 'h-9 w-auto' }: { className?: string; priority?: boolean }) {
  return <SmomoLockup markClassName={className.replace(/w-auto/, '').trim() || 'h-9'} />;
}
