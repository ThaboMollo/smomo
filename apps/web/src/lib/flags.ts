/**
 * Public ratings, review counts, "jobs done" and review text are hidden on the public
 * marketing pages (listings and /pro/[slug]) until review integrity is confirmed: the
 * listed providers currently include seed accounts whose numbers aren't real.
 * Set NEXT_PUBLIC_SHOW_RATINGS=true to switch them back on. Signed-in app screens are unaffected.
 */
export const SHOW_PUBLIC_RATINGS = process.env.NEXT_PUBLIC_SHOW_RATINGS === 'true';
