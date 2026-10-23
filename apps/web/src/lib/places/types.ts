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

/** A located place: what the app stores and sends to the API. */
export type Place = {
  /** Human-readable address to show and save as the address text. */
  label: string;
  lat: number;
  lng: number;
  /** Null when the place is outside the countries SMOMO serves. */
  country: CountryCode | null;
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
