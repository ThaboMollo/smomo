/**
 * Feature switches read from the environment.
 *
 * `NEXT_PUBLIC_` because the address field decides which UI to render in the browser.
 * Next.js inlines these at build time, so changing one needs a rebuild/redeploy, not just
 * a restart — that is the trade-off for being able to read it in a client component.
 */

/** Anything other than an explicit opt-in means parked. Unset included. */
const on = (v: string | undefined) => v === 'true' || v === '1' || v === 'yes';

/**
 * Address search, "use my current location", the draggable map pin and the
 * `/api/places/*` endpoints behind them.
 *
 * OFF (the default): `<AddressField>` renders the manual form instead — country, two
 * address lines, suburb, city and the country's province/district/region — and the
 * `/api/places/*` routes answer 404 so nothing reaches the geocoder. No coordinates are
 * sent at all: migration 16 made them optional, matching falls back to the typed city,
 * and distance is hidden rather than computed from a city centre.
 *
 * ON: the ride-hailing-style autocomplete, exactly as before.
 */
export const GEOLOCATION_ENABLED = on(process.env.NEXT_PUBLIC_GEOLOCATION_ENABLED);
