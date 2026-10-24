import { getPlacesProvider } from '@/lib/places';
import { allow, clientKey, sameOrigin } from '@/lib/places/rate-limit';
import { GEOLOCATION_ENABLED } from '@/lib/features';

/** GET /api/places/reverse?lat=..&lng=.. → { place } (turns a pin or GPS fix into an address) */
export async function GET(req: Request) {
  // Geolocation parked: the endpoint does not exist as far as callers are concerned, so
  // nothing reaches Google or photon.komoot.io. See NEXT_PUBLIC_GEOLOCATION_ENABLED.
  if (!GEOLOCATION_ENABLED) return Response.json({ error: 'not_found' }, { status: 404 });
  if (!sameOrigin(req)) return Response.json({ error: 'forbidden' }, { status: 403 });
  if (!allow(`rv:${clientKey(req)}`)) return Response.json({ error: 'rate_limited' }, { status: 429 });

  const url = new URL(req.url);
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return Response.json({ error: 'bad_request' }, { status: 400 });
  }

  try {
    const place = await getPlacesProvider().reverse(lat, lng, { signal: AbortSignal.timeout(6000) });
    // A pin dropped somewhere with no address data is still a valid location.
    return Response.json({ place: place ?? { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, lat, lng, country: null } });
  } catch {
    return Response.json({ error: 'upstream' }, { status: 502 });
  }
}
