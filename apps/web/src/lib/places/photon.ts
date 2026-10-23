import { COUNTRIES, isCountryCode, type CountryCode } from '@smomo/shared';

import type { Bias, Place, PlacesProvider, Suggestion } from './types';

/**
 * Keyless address search on OpenStreetMap data, via the Photon geocoder (photon.komoot.io).
 * Good enough to launch and demo; it is a shared public service with a fair-use policy and
 * OSM coverage of small-town addresses is patchy, so production should set
 * GOOGLE_MAPS_API_KEY (see lib/places/index.ts) for better results and an SLA.
 */
const BASE = process.env.PHOTON_URL ?? 'https://photon.komoot.io';
const UA = 'SMOMO/1.0 (address search; https://smomo-redesign.vercel.app)';

/** Union of the six countries' bounding boxes: west, south, east, north. */
const REGION_BBOX = [11.7, -34.9, 33.1, -15.6].join(',');

type Feature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    osm_type?: string;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    locality?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
};

function pickCountry(code: string | undefined): CountryCode | null {
  const up = code?.toUpperCase();
  return isCountryCode(up) ? (up as CountryCode) : null;
}

function describe(f: Feature): { primary: string; secondary: string; city?: string; country: CountryCode | null } | null {
  const p = f.properties;
  if (!p) return null;
  const street = [p.housenumber, p.street].filter(Boolean).join(' ');
  const primary = p.name || street || p.locality || p.district || p.city || '';
  if (!primary) return null;
  const city = p.city || p.locality || p.district;
  const country = pickCountry(p.countrycode);
  const parts = [p.name && street ? street : '', p.district, p.locality, p.city, p.state, p.country || (country ? COUNTRIES[country].name : '')]
    .filter((x): x is string => !!x && x !== primary);
  // Drop repeats while keeping order ("Maseru, Maseru District, Lesotho" stays; "Maseru, Maseru" doesn't).
  const secondary = parts.filter((x, i) => parts.indexOf(x) === i).join(', ');
  return { primary, secondary, city, country };
}

function toSuggestion(f: Feature): Suggestion | null {
  const d = describe(f);
  const c = f.geometry?.coordinates;
  if (!d || !c) return null;
  return {
    id: `${f.properties?.osm_type ?? 'x'}${f.properties?.osm_id ?? `${c[1]},${c[0]}`}`,
    primary: d.primary,
    secondary: d.secondary,
    lat: c[1],
    lng: c[0],
    country: d.country,
  };
}

async function getJson(path: string, signal?: AbortSignal) {
  const res = await fetch(`${BASE}${path}`, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal, cache: 'no-store' });
  if (!res.ok) throw new Error(`photon ${res.status}`);
  return (await res.json()) as { features?: Feature[] };
}

export const photon: PlacesProvider = {
  name: 'photon',

  async autocomplete(q, { bias, signal }) {
    const params = new URLSearchParams({ q, limit: '10', lang: 'en', bbox: REGION_BBOX });
    if (bias) {
      params.set('lat', String(bias.lat));
      params.set('lon', String(bias.lng));
    }
    const json = await getJson(`/api/?${params}`, signal);
    const seen = new Set<string>();
    const out: Suggestion[] = [];
    for (const f of json.features ?? []) {
      const s = toSuggestion(f);
      // Only places in the countries we serve; the bounding box alone also covers parts of Angola, Mozambique, etc.
      if (!s || !s.country) continue;
      const key = `${s.primary}|${s.secondary}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(s);
      if (out.length >= 6) break;
    }
    return out;
  },

  // Photon returns coordinates with every suggestion, so there is nothing to resolve.
  async details() {
    return null;
  },

  async reverse(lat, lng, { signal }) {
    const json = await getJson(`/reverse?${new URLSearchParams({ lat: String(lat), lon: String(lng), lang: 'en', limit: '1' })}`, signal);
    const f = json.features?.[0];
    const d = f && describe(f);
    if (!f || !d) return null;
    return {
      label: [d.primary, d.secondary].filter(Boolean).join(', '),
      lat,
      lng,
      country: d.country,
      city: d.city,
    } satisfies Place;
  },
};

export type { Bias };
