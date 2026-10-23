# Southern Africa expansion: address search and six countries

Scope: South Africa, Lesotho, Eswatini (formerly Swaziland), Botswana, Zimbabwe, Namibia. Web app only (`apps/web` + `packages/shared`). The mobile app (`apps/mobile`) is not changed.

## What changed

**Address search (Uber-style).** `components/location/AddressField.tsx`: type-ahead suggestions (keyboard and screen-reader friendly), "Use my current location", a map with a draggable pin to fine-tune the spot, and a "choose your city, then drag the pin" fallback for addresses the search can't find. A typed address now becomes real coordinates; before, it was saved as a text label and the position came from the device GPS or a hard-coded Cape Town fallback.

Used in: request wizard (location required), provider setup and studio profile (where a pro is based; pros could not change this at all before), Discover ("Within 50 km of … Change"), sign-up and profile (home address). The chosen location is remembered per device (`lib/use-location.ts`). The Cape Town fallback is gone.

**Server side.** `/api/places/{autocomplete,details,reverse}` proxy the geocoder so keys never reach the browser. They check the request is same-origin and apply a per-instance rate limit. Providers (`lib/places/`):
- **Photon / OpenStreetMap** (default, no key): works today; shared public service with a fair-use policy; small-town coverage is patchy (for example "Manzini city centre" finds nothing; the city-pick fallback covers this).
- **Google Places (New) + Geocoding**: switches on when `GOOGLE_MAPS_API_KEY` is set. Written to Google's documented request shapes but **not yet run against a live key**; test it once when you add one.

**Countries.** `packages/shared/src/countries.ts`: dial codes, number shapes, map bounds, six cities per country. `toE164(number, country)` now validates length per country (was South Africa only, with no validation). Sign-up has a country-code picker, a country-of-origin list, and accepts passports or national IDs (spaces and dashes allowed). New `/country/[country]` hub pages, a country-grouped city finder and footer, sitemap entries, regional copy and SEO. City pages work for new cities with no API change (the API matches the city name in the provider's address).

## Environment variables (all optional)

| Variable | Purpose |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Use Google for address search. Enable "Places API (New)" and "Geocoding API"; restrict the key to those. Server-side only. |
| `PHOTON_URL` | Point at your own Photon instance instead of the public one. |
| `NEXT_PUBLIC_MAP_TILES_URL`, `NEXT_PUBLIC_MAP_ATTRIBUTION` | Map tile provider. Default is OpenStreetMap's public tiles, fine for light use; use a commercial tile provider before heavy traffic. |
| `NEXT_PUBLIC_SHOW_RATINGS` | See `lib/flags.ts`. |

## Not done: needs decisions or access

1. **Currency.** Every price column is `*_zar`. Prices are still shown in South African rand everywhere, with a note for non-SA locations. Lesotho (loti), Eswatini (lilangeni) and Namibia (dollar) are pegged 1:1 to the rand; Botswana (pula) and Zimbabwe (ZiG / US dollar) are not. Real multi-currency needs a database and API change.
2. **Payments.** The payment flow is built around **PayShap, which only works in South Africa**. Outside SA the app says to agree the payment method in chat, but the booking screens still say "PayShap". A generic payment-method model is a product decision plus a database and API change.
3. **Database and API access.** The API (`smomo-api.vercel.app`) and Supabase project aren't reachable from this workspace, so nothing was changed there. Recommended: a `country` column on profiles and requests, currency columns, and a payment-method field.
4. **SMS and email.** No SMS or email sending is configured; sign-in is email and password only, with no OTP or password reset.
5. **Mobile app.** `apps/mobile` still uses the old location logic and rand-only pricing.
6. **ID numbers.** The database only knows `sa_id` and `passport`. National IDs from neighbouring countries are stored as `passport` with the country name. A `national_id` type needs a database change.
7. **Providers.** There are none in the new countries yet; searches there show an honest "just opening" state.
