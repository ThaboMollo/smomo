/**
 * Feature switches read from the environment.
 *
 * `EXPO_PUBLIC_` because these are read in the app bundle. Expo inlines them at build
 * time, so a change needs a fresh `expo start --clear` (or a new build), not just a
 * reload — the same trade-off as the web's `NEXT_PUBLIC_` equivalent.
 */

/** Anything other than an explicit opt-in means parked. Unset included. */
const on = (v: string | undefined) => v === 'true' || v === '1' || v === 'yes';

/**
 * Device GPS and geocoding: `expo-location`'s permission prompt, position fixes,
 * reverse geocoding and forward geocoding.
 *
 * OFF (the default): nothing asks for location permission, and the screens that used to
 * read a position collect a typed address instead (`<ManualAddressFields>`), sending no
 * coordinates at all. Migration 16 made them optional; matching falls back to the typed
 * city and distance is hidden rather than measured from a city centre.
 *
 * ON: GPS as before.
 *
 * Keep this in step with the web's `NEXT_PUBLIC_GEOLOCATION_ENABLED` — they are one
 * product decision expressed per runtime, and splitting them would let the two apps
 * collect addresses in two different shapes.
 */
export const GEOLOCATION_ENABLED = on(process.env.EXPO_PUBLIC_GEOLOCATION_ENABLED);
