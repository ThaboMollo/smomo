/**
 * Manual address entry — the shape used when geolocation is parked.
 *
 * With address search switched off (see the `GEOLOCATION_ENABLED` flag in each app) there
 * is no geocoder to turn what someone typed into a point, so the apps collect the address
 * field by field instead and send **no coordinates at all**. Migration 16 made that
 * possible: `booking_requests.location` is nullable and `search_providers` /
 * `feed_requests_for_practitioner` fall back to matching on the city, returning
 * `distance_km` as null rather than a distance measured from a city centre.
 */
import { COUNTRIES, type CountryCode } from './countries';

export type StructuredAddress = {
  country: CountryCode;
  /** Street number and name, or the building. */
  line1: string;
  /** Unit, complex, floor. Optional by design. */
  line2?: string | null;
  suburb: string;
  city: string;
  /** Province, district or region — whichever the country uses. */
  subdivision: string;
};

/** An empty form, ready to bind to inputs. South Africa is the home market. */
export function emptyAddress(country: CountryCode = 'ZA'): StructuredAddress {
  return { country, line1: '', line2: '', suburb: '', city: '', subdivision: '' };
}

/** Line 2 is the only optional part; everything else is needed to locate someone at all. */
export function isAddressComplete(a: StructuredAddress): boolean {
  return !!(a.country && a.line1.trim() && a.suburb.trim() && a.city.trim() && a.subdivision.trim());
}

/** Which fields are missing, keyed for showing an error under the right input. */
export function addressErrors(a: StructuredAddress): Partial<Record<keyof StructuredAddress, string>> {
  const e: Partial<Record<keyof StructuredAddress, string>> = {};
  const label = COUNTRIES[a.country]?.subdivisionLabel ?? 'Province';
  if (!a.line1.trim()) e.line1 = 'Add the street number and name';
  if (!a.suburb.trim()) e.suburb = 'Add the suburb';
  if (!a.city.trim()) e.city = 'Add the city or town';
  if (!a.subdivision.trim()) e.subdivision = `Choose the ${label.toLowerCase()}`;
  return e;
}

/**
 * One display line, the same text that goes into the `address` columns so saved addresses
 * read identically whether they came from search or from the form.
 */
export function formatAddress(a: StructuredAddress): string {
  return [a.line1, a.line2, a.suburb, a.city, a.subdivision, COUNTRIES[a.country]?.name]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

const norm = (s: string) => s.trim().toLowerCase().replace(/[\s'\u2019-]+/g, '');

/**
 * True when the typed city is one we list for that country.
 *
 * There is deliberately no `coordsForAddress` any more. It used to return the city's
 * centre so a typed address still had a point, which made "2.1 km away" a number nobody
 * could stand behind. Since migration 16 a request or a base may simply have no
 * coordinates, and matching falls back to the city — so the honest answer is to send no
 * point at all. This helper only drives wording, e.g. telling someone their town isn't
 * one we know yet.
 */
export function isCityKnown(a: StructuredAddress): boolean {
  const country = COUNTRIES[a.country];
  if (!country) return false;
  const typed = norm(a.city);
  return country.cities.some((c) => norm(c.name) === typed);
}
