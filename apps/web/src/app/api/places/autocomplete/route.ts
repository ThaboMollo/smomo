import { getPlacesProvider } from '@/lib/places';
import { allow, clientKey, sameOrigin } from '@/lib/places/rate-limit';

/** GET /api/places/autocomplete?q=...&lat=..&lng=..&session=.. → { provider, suggestions } */
export async function GET(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!allow(`ac:${clientKey(req)}`)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 120);
  if (q.length < 3) return Response.json({ provider: getPlacesProvider().name, suggestions: [] });

  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const bias = Number.isFinite(lat) && Number.isFinite(lng) && url.searchParams.has('lat') ? { lat, lng } : undefined;
  const session = url.searchParams.get('session')?.slice(0, 64) || undefined;

  const provider = getPlacesProvider();
  try {
    const suggestions = await provider.autocomplete(q, { bias, session, signal: AbortSignal.timeout(6000) });
    return Response.json({ provider: provider.name, suggestions }, { headers: { 'Cache-Control': 'private, max-age=120' } });
  } catch {
    // The caller shows "couldn't search right now" and lets the person carry on.
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
