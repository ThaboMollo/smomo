# Smomo v3 — Web App + Shared NestJS API (Implementation Spec)

## Context
Add a **Next.js web app** (SEO-first: "search tattoos → Smomo appears") alongside the existing
Expo mobile app, and extract all shared Supabase/business logic into a **NestJS API layer** so both
clients share one implementation. Built as a **monorepo**. This spec is assembled via a
phase-by-phase interview.

## Locked high-level decisions
- **API scope = Hybrid.** NestJS owns business/data logic. **Supabase Auth (JWT), Realtime
  (chat/feed) and Storage (uploads) stay direct on the clients.** RLS remains a safety net.
- **Hosting = Vercel** for both `web` (Next.js) and `api` (NestJS as Node functions).
- **API auth = forward the user's Supabase JWT.** NestJS verifies it and calls the DB with that
  JWT so existing RLS/RPCs still enforce access.
- **Web rendering = ISR/SSG** for public/SEO pages; client-side hydration for authed/interactive.

## Target structure (monorepo)
```
smomo/
  apps/
    mobile/        # existing Expo app (moved here)
    web/           # new Next.js App Router app
    api/           # new NestJS API
  packages/
    shared/        # DB types, domain types, zod contracts, pure utils (categories/format/saId)
    api-client/    # typed SDK wrapping fetch → NestJS, used by mobile & web
    ui-tokens/     # brand tokens (colors light/dark, spacing, radius, fontSize) — values only
    config/        # shared eslint + tsconfig base
  turbo.json, pnpm-workspace.yaml
```

---

## DECISIONS LOG

### Phase 0 — Monorepo & tooling ✅
- **Package manager: pnpm** (Expo needs `.npmrc` with `node-linker=hoisted` + Metro monorepo config).
- **Orchestrator: Turborepo** (task caching + pipelines; Vercel-native).
- **Shared packages (all four): `shared`, `api-client`, `ui-tokens`, `config`.**
- Existing Expo app moves to `apps/mobile` (git history preserved via `git mv`).

### Phase 1 — Shared packages ✅
- **Contracts = zod schemas in `packages/shared`** (single source of truth). NestJS validates via
  nestjs-zod; api-client infers TS types from the same schemas. No codegen step.
- **api-client = typed fetch SDK + `getToken()` callback** (reads Supabase session). Both apps use
  **TanStack Query** (web also uses server-side RSC fetch for SEO pages).
- **DB types live in `packages/shared`**; `pnpm gen:types` regenerates from Supabase on schema change.
- `ui-tokens` = brand values extracted from mobile `theme.ts` (colors/spacing/radius/fontSize);
  web maps them into its Tailwind theme, mobile imports them directly.

### Phase 2 — NestJS API foundation ✅
- **DB logic = call existing Postgres RPCs** via the user-JWT Supabase client (reuse accept_offer,
  create_request, make_offer, verify_payment, etc.). New logic may be added in Nest services.
- **Default DB access = per-request Supabase client with the user's JWT** (RLS applies).
  Service-role client reserved for admin/cron only.
- **JWT verification = `supabase.auth.getUser()` per request** (fresh/revocation-aware). Add a
  short-lived in-memory token→user cache to cut the round-trip cost.
- **Authz = global auth guard + `@RequireRegistered()` decorator** (blocks anonymous users on
  publish/save/booking/payment endpoints); public endpoints explicitly opt out with `@Public()`.
- REST, `/v1` prefix, zod DTO validation (nestjs-zod), global exception filter mapping
  Supabase/Postgres errors → clean HTTP responses.

### Phase 3 — API endpoints ✅
- **Authed REST modules** (per domain, `/v1`): `providers` (search, :id), `requests`
  (create/list/:id + offers), `offers` (make/accept), `bookings` (list/:id + start/complete/cancel),
  `payments` (mark/verify), `reviews`, `me` (profile), `practitioner` (profile/services/portfolio/
  online/finalize), `admin` (reports/disputes), `identity`, `subscriptions`.
- **Public (no-auth) SEO endpoints** `/v1/public/*` returning public-safe fields only:
  - **Provider profiles** `/public/providers/:slug` (bio, categories, rating, public portfolio,
    services + "from" prices, **public c2p reviews**).
  - **Category + city listings** `/public/:category/:city` (core "search tattoos" pages).
  - **Aggregate hub pages** `/public/:city` and `/public/:category` (internal linking).
  - Marketing/home content is static in the web app (no API needed).
- **Slugs:** add unique `practitioner_profiles.slug` (business-name + short-id, e.g.
  `glow-by-thandi-7f3a`); migration + backfill for seeded rows. Powers `/pro/[slug]`.
- **Pagination:** `limit`/`offset` + `total` on listings/feeds.
- Also need a **marketing landing page** in web explaining what Smomo is & how it works.

### Phase 4 — Mobile migration ✅
- **Full cutover:** rewrite all `src/data/*` hooks to call `api-client`; remove direct supabase-js
  data calls (incl. in-screen queries like payshap proxy, provider detail). Keep TanStack Query.
- **Stays direct to Supabase on mobile:** Auth (session/JWT), Realtime chat, Storage uploads.
  **Everything else (discovery, feed polling, all reads/writes) goes through the NestJS API.**
- api-client `getToken()` reads the Supabase session token; anonymous sessions still work (API
  accepts anon JWTs, gates writes via `@RequireRegistered()`).
- Verify end-to-end on the emulator after cutover.

### Phase 5 — Web foundation ✅
- **UI = Tailwind + shadcn/ui**, themed from `ui-tokens` so web matches the mobile brand.
- **Auth = public browse open; login/register required to transact** (post requests, book, chat).
  No anonymous sessions on web (public pages cover browsing).
- **Sessions = `@supabase/ssr`** (cookie-based; works in RSC, route handlers, middleware).
- Authed area under `/app` (or `/dashboard`) protected by middleware; public/SEO pages are open.

### Phase 6 — Web SEO ✅
- **Human-readable URLs:** `/` (home), `/how-it-works`, `/[category]/[city]` listings,
  `/pro/[slug]` profiles, `/[category]` & `/[city]` hubs. Enum→slug map
  (tattoo_artist→`tattoo-artists`, nail_technician→`nail-technicians`, makeup_artist→`makeup-artists`,
  hairdresser→`hairdressers`, beautician→`beauticians`).
- **Cities:** curated ~10 SA metros pre-generated; long-tail cities render on-demand then cached (ISR).
- **Revalidate:** listings 1h, provider profiles 15m.
- **SEO tech:** per-page `generateMetadata` (title/description/canonical/OG), **JSON-LD** (`LocalBusiness`/
  `Service` on profiles, `ItemList` on listings, `BreadcrumbList` on hubs), `sitemap.ts`, `robots.ts`.

### Phase 7 — Web authed features ✅
- **Sequence:** ship **full CLIENT web parity first** (post/track requests, view & accept offers,
  bookings, per-booking chat, PayShap pay, reviews) + all SEO; then **practitioner** (studio, feed,
  offers, schedule, complete+proof, portfolio) and **admin** in a follow-up.
- **Hybrid parity confirmed on web:** per-booking chat via Supabase Realtime in the browser;
  PayShap payment + verify flow; direct-to-Storage image uploads; **web push notifications**.

### Phase 8 — Deploy & CI ✅
- **Pipeline:** Vercel Git auto-deploy — two Vercel projects (`web`, `api`) from the monorepo;
  preview per PR, production on `main`. Gated DEV→UAT→PROD can be layered on later.
- **Domain:** `*.vercel.app` for now; custom domain later (web on apex, api on `api.<domain>`).
- **Env:** `vercel env` per project — service role only in `api`; web gets Supabase anon + API URL;
  mobile gets `EXPO_PUBLIC_API_URL` + Supabase anon (EAS secrets). Mobile ships via **EAS** (not Vercel).

---

## IMPLEMENTATION STATUS
- ✅ **Phase 0** — monorepo live (pnpm 9.12 + Turborepo); Expo app at `apps/mobile`, verified it
  still bundles (5.5MB iOS). `.npmrc` hoisted + monorepo `metro.config.js`.
- ✅ **Phase 1** — packages `config`, `ui-tokens`, `shared` (types+dtos+zod contracts+utils),
  `api-client` (typed SDK) all built (tsup → JS/CJS/d.ts).
- ✅ **Phase 2+3** — NestJS API built & verified: auth guard (`getUser` + cache), per-request
  user-JWT Supabase client, `@RequireRegistered()`, zod validation, exception filter, `/v1`.
  Domain modules (providers, requests, offers, bookings, payments, reviews, me, practitioner,
  reports, admin) call the existing RPCs; public SEO module (`/public/*`). Slug migration + backfill.
  Smoke-tested: health, public provider/listing/hub, authed search via anon JWT (RLS), 403 gate. ✅
- ✅ **Phase 4** — mobile cutover: `src/data/*` + AuthProvider now call `@smomo/api-client`; lib
  utils/types/theme re-export from `@smomo/shared`/`@smomo/ui-tokens`; Auth/Realtime(chat)/Storage
  stay direct. Typechecks + bundles (6.2MB iOS). `EXPO_PUBLIC_API_URL` = `http://10.0.2.2:4000/v1` (emulator).
- ✅ **Phase 5** — Next.js 16 web app (Tailwind v4). Public SEO pages built & verified rendering
  real API data with JSON-LD: home, how-it-works, `/[category]`, `/[category]/[city]` (50 SSG pages),
  `/city/[city]`, `/pro/[slug]` (ISR), sitemap.ts, robots.ts. `next build` → 72 static pages.
- ✅ **Phase 6** — web authed client: @supabase/ssr (browser+server clients, middleware/proxy guard),
  login/register (email+password, SA-ID validated), `/app` dashboard, post request (geo + photo upload),
  offers+accept, booking detail with PayShap pay + realtime chat. `next build` green (dynamic /app/*).
- ✅ **Phase 7** — web practitioner + admin. `useMe()` hook + role-aware `AppNav`; Studio
  (become-a-provider setup calling saveBusiness+finalize, online toggle, verification/subscription
  badges), services CRUD, portfolio (Storage upload + delete), request feed with make-offer
  (polling refetch), admin queues (payment disputes + reports resolve/dismiss), and booking page
  extended with practitioner actions (start job, complete + proof-photo upload + rate client).
  `uploadImage()` helper → Supabase Storage. `next build` green (all `/app/*` dynamic).
- ✅ **Phase 8** — deployed to Vercel (team `thabomollos-projects`, hobby). Two git-linked projects
  off `github.com/ThaboMollo/smomo` (private), auto-deploy on push to `main`:
  - **smomo-api** (`prj_Q5c9mNUlUlR4IKTyAyPmqjNgVPfq`, root `apps/api`) → **https://smomo-api.vercel.app**.
    NestJS as a serverless function: `apps/api/api/index.ts` (cached Express instance from compiled
    `dist/`), `vercel.json` builds via `pnpm --filter=api... run build`, `outputDirectory: public`
    (static landing), rewrites `/(.*) → /api`. Env: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (prod+preview).
    Verified: `/v1/health` = `{"ok":true}`, `/v1/public/*` returns live Supabase data.
  - **smomo** (`prj_2RLafC3xLWxKzhb9Bt54h77dlxgE`, root `apps/web`) → **https://smomo.vercel.app**.
    Next.js; `vercel.json` builds via `pnpm --filter=web... run build`. Env (prod+preview):
    `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` +
    `API_URL` = `https://smomo-api.vercel.app/v1`, `NEXT_PUBLIC_SITE_URL` = `https://smomo.vercel.app`.
    Verified: home/login/sitemap 200; SEO listing renders JSON-LD + live API data (SSR → prod API).
  - NOTE: hobby plan = 1 concurrent build, so a push builds api+web sequentially (one may queue).
  - PENDING: mobile EAS build with `EXPO_PUBLIC_API_URL=https://smomo-api.vercel.app/v1`.

## BUILD SEQUENCE
1. **Monorepo**: init `pnpm-workspace.yaml` + `turbo.json`; `git mv` current app → `apps/mobile`;
   add `.npmrc` (`node-linker=hoisted`) + Metro monorepo config; confirm mobile still bundles.
2. **Packages**: `config` (eslint/tsconfig) → `ui-tokens` (extract from mobile `theme.ts`) →
   `shared` (move DB types + categories/format/saId utils + zod contracts) → `api-client`
   (typed fetch SDK + `getToken()`). Add `pnpm gen:types`.
3. **API (`apps/api`, NestJS)**: auth guard (`getUser` + token cache) → per-request Supabase client
   → domain modules calling existing RPCs → `public` module → zod validation + exception filter →
   `/v1`. Migration: add `practitioner_profiles.slug` (+ backfill). Deploy to Vercel.
4. **Mobile cutover**: rewrite `src/data/*` to `api-client`; keep Supabase Auth/Realtime/Storage;
   verify full flow on the emulator.
5. **Web (`apps/web`, Next.js)**: Tailwind + shadcn + `@supabase/ssr`; **public SEO** (ISR listings/
   profiles/hubs + JSON-LD + sitemap/robots) + **home/how-it-works**; then **client authed area**
   (post request, offers, accept, bookings, chat, pay, reviews); then **practitioner + admin**.
6. **Deploy/CI**: Vercel projects (web, api) + env; mobile EAS with `EXPO_PUBLIC_API_URL`.

## VERIFICATION
- Mobile still bundles after monorepo move (Metro/`expo export`).
- API: hit `/v1/public/providers/:slug` (no auth) and an authed endpoint with a Supabase JWT;
  confirm RLS still applies (user JWT) and `@RequireRegistered()` blocks anon writes.
- Mobile post-cutover: full flow on emulator via the API (discover → request → offer → accept →
  pay → complete → review).
- Web: Lighthouse/SEO check on `/tattoo-artists/cape-town` & `/pro/[slug]` (metadata + JSON-LD +
  indexable HTML); authed client flow end-to-end.

## RISKS / NOTES
- **Expo + pnpm monorepo**: needs hoisted node-linker + Metro `watchFolders`/`nodeModulesPaths`.
- **NestJS on Vercel serverless**: cold starts; the `getUser` token cache mitigates per-request cost.
- **Slug backfill** for seeded providers; ensure uniqueness.
- **Public endpoints** must return only public-safe columns (no ID numbers, phones, payshap).

