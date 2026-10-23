import { COUNTRIES, COUNTRY_CODES, isCountryCode, type CountryCode } from '@smomo/shared';

import type { Place, PlacesProvider, Suggestion } from './types';

/**
 * Google Places (New) + Geocoding. Active when GOOGLE_MAPS_API_KEY is set.
 *
 * Needs a Google Cloud project with billing and these APIs enabled: "Places API (New)" and
 * "Geocoding API". Restrict the key to those APIs (it is only ever used server-side, from
 * the /api/places routes, so an IP/HTTP-referrer restriction isn't needed and the key is
 * never sent to the browser).
 *
 * NOTE: written against Google's documented request/response shapes; it has not been run
 * against a live key yet. Check it once with a real key before relying on it.
 */
const KEY = () => process.env.GOOGLE_MAPS_API_KEY ?? '';
const REGIONS = COUNTRY_CODES.map((c) => c.toLowerCase());

type AddressComponent = { longText?: string; shortText?: string; types?: string[] };

function countryOf(components: AddressComponent[] | undefined): CountryCode | null {
  const short = components?.find((c) => c.types?.includes('country'))?.shortText?.toUpperCase();
  return isCountryCode(short) ? (short as CountryCode) : null;
}

function cityOf(components: AddressComponent[] | undefined): string | undefined {
  const pick = (t: string) => components?.find((c) => c.types?.includes(t))?.longText;
  return pick('locality') ?? pick('postal_town') ?? pick('administrative_area_level_2') ?? pick('sublocality');
}

export const google: PlacesProvider = {
  name: 'google',

  async autocomplete(q, { bias, session, signal }) {
    const body: Record<string, unknown> = {
      input: q,
      includedRegionCodes: REGIONS,
      languageCode: 'en',
    };
    if (session) body.sessionToken = session;
    if (bias) body.locationBias = { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 50000 } };
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': KEY() },
      body: JSON.stringify(body),
      signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`google autocomplete ${res.status}`);
    const json = (await res.json()) as {
      suggestions?: { placePrediction?: { placeId: string; text?: { text: string }; structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } } } }[];
    };
    const out: Suggestion[] = [];
    for (const s of json.suggestions ?? []) {
      const p = s.placePrediction;
      if (!p) continue;
      out.push({
        id: p.placeId,
        primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        secondary: p.structuredFormat?.secondaryText?.text ?? '',
        // The country is only confirmed when the place is resolved (the search itself is
        // already restricted to the six countries).
      });
    }
    return out.filter((s) => s.primary);
  },

  async details(id, { session, signal }) {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`);
    url.searchParams.set('languageCode', 'en');
    if (session) url.searchParams.set('sessionToken', session);
    const res = await fetch(url, {
      headers: { 'X-Goog-Api-Key': KEY(), 'X-Goog-FieldMask': 'formattedAddress,location,addressComponents' },
      signal,
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(`google details ${res.status}`);
    const j = (await res.json()) as { formattedAddress?: string; location?: { latitude: number; longitude: number }; addressComponents?: AddressComponent[] };
    if (!j.location) return null;
    return {
      label: j.formattedAddress ?? '',
      lat: j.location.latitude,
      lng: j.location.longitude,
      country: countryOf(j.addressComponents),
      city: cityOf(j.addressComponents),
    } satisfies Place;
  },

  async reverse(lat, lng, { signal }) {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('language', 'en');
    url.searchParams.set('key', KEY());
    const res = await fetch(url, { signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`google reverse ${res.status}`);
    const j = (await res.json()) as {
      results?: { formatted_address: string; address_components?: { long_name: string; short_name: string; types: string[] }[] }[];
    };
    const r = j.results?.[0];
    if (!r) return null;
    const comps: AddressComponent[] = (r.address_components ?? []).map((c) => ({ longText: c.long_name, shortText: c.short_name, types: c.types }));
    const country = countryOf(comps);
    return {
      label: r.formatted_address || (country ? COUNTRIES[country].name : ''),
      lat,
      lng,
      country,
      city: cityOf(comps),
    } satisfies Place;
  },
};
