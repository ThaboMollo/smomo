import { getPlacesProvider } from '@/lib/places';
import { allow, clientKey, sameOrigin } from '@/lib/places/rate-limit';

/** GET /api/places/details?id=..&session=.. → { place } (for providers that don't return coordinates with suggestions) */
export async function GET(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!allow(`dt:${clientKey(req)}`)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const url = new URL(req.url);
  const id = (url.searchParams.get('id') ?? '').slice(0, 200);
  if (!id) return Response.json({ error: 'bad_request' }, { status: 400 });
  const session = url.searchParams.get('session')?.slice(0, 64) || undefined;

  try {
    const place = await getPlacesProvider().details(id, { session, signal: AbortSignal.timeout(6000) });
    return place ? Response.json({ place }) : Response.json({ error: 'not_found' }, { status: 404 });
  } catch {
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
