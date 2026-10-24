import type { CountryCode } from '@smomo/shared';

/** One row in the address dropdown. Coordinates are present when the provider returns them up front. */
export type Suggestion = {
  id: string;
  /** Main line, e.g. "Rosebank Mall" or "12 Main Road". */
  primary: string;
  /** Context line, e.g. "Rosebank, Johannesburg, South Africa". */
  secondary: string;
  lat?: number;
  lng?: number;
  /** The country when the provider says so up front; undefined when it is only known once resolved. */
  country?: CountryCode | null;
};

/**
 * A place the app can act on: what it stores and sends to the API.
 *
 * Coordinates are nullable since migration 16. With geolocation parked there is no
 * geocoder, so a typed address has no point and `city` is what matching uses instead —
 * we deliberately do not substitute a city centre, because every distance derived from
 * it would be fiction. A Place therefore always has either coordinates or a city.
 */
export type Place = {
  /** Human-readable address to show and save as the address text. */
  label: string;
  lat: number | null;
  lng: number | null;
  /** Null when the place is outside the countries SMOMO serves. */
  country: CountryCode | null;
  /** City/town. Required when there are no coordinates; it carries the match. */
  city?: string;
};

export type Bias = { lat: number; lng: number };

export interface PlacesProvider {
  readonly name: 'google' | 'photon';
  autocomplete(q: string, opts: { bias?: Bias; session?: string; signal?: AbortSignal }): Promise<Suggestion[]>;
  /** Resolve a suggestion that came back without coordinates. */
  details(id: string, opts: { session?: string; signal?: AbortSignal }): Promise<Place | null>;
  reverse(lat: number, lng: number, opts: { signal?: AbortSignal }): Promise<Place | null>;
}
