# Smomo (redesign)

This repo is the **UX-led redesign** of the Smomo web app (`apps/web`), forked from `smomo-main`.
Bento layout (large rounded panels, deep-violet feature panels, pill actions, giant wordmark footer),
brand colours only (Deep Violet #6D28D9, Soft Lilac #EDE9FE, Rose Gold #D4AF7C), no orange.
Cormorant Garamond display type over DM Sans. UX changes: hero service + city finder, photo-first
provider cards, split-screen auth with a 2-step register and inline validation, a 3-step request
wizard with a review screen, a mobile bottom tab bar, honest location fallback, and real empty states.
The API, Supabase project and data contracts are unchanged.


An **inDrive-style marketplace for beauty & body services** in South Africa — connecting clients
with hairdressers, nail technicians, make-up artists, beauticians and tattoo artists.

Clients post a request (or browse nearby providers), online providers send offers, the client
picks one, they chat & coordinate, the client pays the provider directly via **PayShap**, and the
provider verifies payment and captures proof-of-work that flows into their portfolio.

## Stack
- **Mobile:** Expo (React Native, TypeScript) + expo-router — iOS & Android
- **Backend:** Supabase — Postgres + PostGIS, Auth (phone/OTP), Storage, Realtime, Edge Functions
  - Project `smomo` · ref `ltnjiihfgvwtzrmtkclh` · region eu-west-1
- **Data:** TanStack Query + supabase-js · **Maps:** react-native-maps + expo-location

## Run it
```bash
npm install
npx expo start        # press i (iOS), a (Android), or scan the QR in Expo Go
```
`.env` is already populated with the Supabase URL + publishable key.

> Maps, camera and push need a **dev build** (`npx expo run:ios` / `run:android`) for full
> fidelity; most of the app also works in Expo Go.

## Feature switches

### Geolocation

Address search and device GPS are behind **one switch, set per runtime**. It is **off by
default** — unset, or anything other than `true` / `1` / `yes`, means parked.

| App | Variable | File | Also set in |
|-----|----------|------|-------------|
| Web | `NEXT_PUBLIC_GEOLOCATION_ENABLED` | `apps/web/.env.local` | Vercel → Project → Settings → Environment Variables |
| Mobile | `EXPO_PUBLIC_GEOLOCATION_ENABLED` | `apps/mobile/.env` | EAS build profile (`eas.json` → `env`) |

Both are read in exactly one place each — `apps/web/src/lib/features.ts` and
`apps/mobile/src/lib/features.ts` — and nothing else reads `process.env` for this.

**Off (parked).** `<AddressField>` renders `<ManualAddressField>` instead of the
autocomplete, and the person types the address out: country, address line 1, address line 2
(optional), suburb, city, and whatever that country calls its province — Province in
South Africa and Zimbabwe, District in Lesotho and Botswana, Region in Eswatini and
Namibia (`subdivisions` in `packages/shared/src/countries.ts`). The `/api/places/*` routes
answer 404, so nothing reaches Google or `photon.komoot.io`. On mobile nothing asks for
location permission; Discover gets a country + city picker instead of a GPS fix.

**No coordinates are sent at all.** Migration 16 made the point optional
(`booking_requests.location` dropped its NOT NULL) and added a `city` column to
`booking_requests` and `practitioner_profiles`. `search_providers` and
`feed_requests_for_practitioner` match on the typed city whenever either side has no
point, and return `distance_km` as **null** — so the apps hide distance rather than
printing a number measured from a city centre. A request or a base must carry either
coordinates or a city; the RPC refuses one with neither.

**The client's street address is no longer in the practitioner feed.** It used to be:
`feed_requests_for_practitioner` returned `address` to every eligible practitioner
browsing open requests. It now returns `city` only. The full address reaches the
practitioner once the client accepts an offer — `accept_offer` copies it onto `bookings`
with status `confirmed`, and `bookings.bk_select_party` lets that practitioner read it
from there.

**On.** The ride-hailing-style autocomplete, "use my current location", the draggable map
pin and device GPS, exactly as before. Nothing else changes: both implementations satisfy
the same props, so all six web call sites and every mobile screen are untouched either way.

Both are inlined at build time, so flipping either one needs a rebuild — a Vercel redeploy
for web, `expo start --clear` or a new build for mobile. Not just a restart.

## Required manual configuration
A few things need dashboard/credentials access that can't be scripted:

1. **Phone/OTP sign-in** — In the Supabase dashboard → **Auth → Providers → Phone**, enable Phone
   auth and connect an SMS provider (Twilio recommended for SA). For development, add **test phone
   numbers with fixed OTPs** (Auth → Phone) so you can sign in without sending real SMS.
   *Until this is enabled, the OTP screen won't receive a code.*
2. **Push notifications** — Run `eas init` to get an EAS project id; the app reads it from
   `expoConfig.extra.eas.projectId`. Push is best-effort (via the `send-push` Edge Function) and
   silently no-ops until configured.
3. **Android Maps** — Add a Google Maps API key under `android.config.googleMaps.apiKey` in
   `app.json`. iOS uses Apple Maps (no key needed).
4. **Make yourself an admin** — after signing in, set `profiles.is_admin = true` for your user to
   access the in-app Admin dashboard (reports & payment disputes).

## Demo data
Three verified, online providers are seeded around Cape Town CBD (Glow by Thandi, Naledi Nails,
Ink & Co) so Discover has content immediately.

## Project structure
```
src/
  app/                 expo-router routes
    (auth)/            phone sign-in, OTP, profile setup
    (app)/
      (client)/        discover, activity, chats, profile
      (work)/          feed, schedule, chats, studio
      onboarding, new-request, request/[id], offer/[id],
      booking/[id], complete/[id], review/[id], provider/[id],
      chat/[id], report, admin, services, portfolio, edit-studio
  data/                TanStack Query hooks (discovery, requests, bookings, chat, practitioner, misc)
  lib/                 supabase client, theme, categories, format, saId (Luhn), location, upload, push
  providers/           AuthProvider (session+profile), ModeProvider (client/work)
  ui.tsx               shared component kit
  types/database.ts    generated Supabase types
supabase/functions/send-push/   Expo push Edge Function (deployed)
```

## Data model & security
See the plan/design doc for the full model. Highlights:
- Single **person** account; being a provider = having a `practitioner_profiles` row. Client/Work
  is a UI mode toggle.
- **Verification** gates *accepting* bookings (SA ID validated by Luhn; passport = format check).
- **PayShap** is peer-to-peer: the app records payments and the provider verifies them; disputes
  escalate to Admin. Deposits supported.
- **RLS** on every table; sensitive ID data isolated in `practitioner_identity` (owner/admin only);
  broadcast matching runs through `SECURITY DEFINER` RPCs.
