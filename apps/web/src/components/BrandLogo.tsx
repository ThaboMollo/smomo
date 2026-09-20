import Image from 'next/image';

/**
 * The Smomo wordmark, theme-aware. Both variants render and CSS shows the right
 * one for the active `data-theme` (set pre-paint in the root layout), so the
 * swap is instant with no flash and no client JS.
 *
 * - light theme → dark-ink logo on the light ground
 * - dark theme  → light-ink logo (trimmed to match the light one's proportions)
 *
 * Pass sizing via `className` (e.g. "h-9 w-auto"); it applies to both variants.
 */
export function BrandLogo({ className = '', priority = false }: { className?: string; priority?: boolean }) {
  return (
    <>
      <Image
        src="/assets/Smomo_logo_light.png"
        alt="Smomo"
        width={880}
        height={310}
        priority={priority}
        className={`brand-logo-light ${className}`}
      />
      <Image
        src="/assets/Smomo_logo_dark_nav.png"
        alt="Smomo"
        width={322}
        height={103}
        priority={priority}
        className={`brand-logo-dark ${className}`}
      />
    </>
  );
}
