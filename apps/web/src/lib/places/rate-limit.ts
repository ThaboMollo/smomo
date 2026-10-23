/**
 * Small per-instance rate limiter for the public /api/places routes. Serverless instances
 * don't share memory, so this is a brake on a single noisy client, not a hard global quota.
 */
const hits = new Map<string, { n: number; reset: number }>();

export function allow(key: string, limit = 90, windowMs = 60_000): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return true;
  }
  h.n += 1;
  return h.n <= limit;
}

/** Same-origin check: the routes are for this site's own pages, not a free geocoding API. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  const site = req.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  if (origin) {
    try {
      return new URL(origin).host === new URL(req.url).host;
    } catch {
      return false;
    }
  }
  return true;
}

export function clientKey(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
}
