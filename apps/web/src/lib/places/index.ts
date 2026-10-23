import { google } from './google';
import { photon } from './photon';
import type { PlacesProvider } from './types';

export type { Bias, Place, PlacesProvider, Suggestion } from './types';

/** Google when a key is configured, otherwise the keyless OpenStreetMap geocoder. */
export function getPlacesProvider(): PlacesProvider {
  return process.env.GOOGLE_MAPS_API_KEY ? google : photon;
}
