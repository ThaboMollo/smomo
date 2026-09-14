# Smomo

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
