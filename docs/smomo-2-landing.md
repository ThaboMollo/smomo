# SMOMO 2.0: landing page rebrand

Branch: `feat/smomo-2-landing` (from `main`). Scope: the homepage `/` only. Every other route keeps its existing design and behaviour.

## Preview locally

```bash
npx pnpm@9.12.0 install --frozen-lockfile --filter "web..."
vercel env pull apps/web/.env.local --environment=development   # public Supabase/API vars; file is git-ignored
npx pnpm@9.12.0 --filter "web..." run build                     # also builds the workspace packages
cd apps/web && npx next start -p 3100                           # http://localhost:3100
```

If you've visited the site before on the same `localhost` port, unregister the service worker (DevTools → Application) or it may serve a cached older build.

## Architecture

| Piece                                                                        | Where                                                                                        |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Page (composition, metadata, viewport)                                       | `apps/web/src/app/page.tsx`                                                                  |
| Scoped styles (type scale, buttons, placeholders, motion)                    | `apps/web/src/app/landing.css`                                                               |
| Brand tokens (ink, canvas, pink, pink-deep, lilac, lime, line, display font) | `@theme` block in `apps/web/src/app/globals.css` (additive)                                  |
| Copy, routes, asset register, trust claims                                   | `apps/web/src/lib/landing-content.ts`                                                        |
| Live provider preview data                                                   | `apps/web/src/lib/landing-data.ts` (public API, same source as category pages)               |
| Components                                                                   | `apps/web/src/components/landing/`                                                           |
| Header/footer swap                                                           | `SiteHeader.tsx` / `SiteFooter.tsx` render the landing versions only when `pathname === '/'` |

Components: `LandingHeader` (sticky, scroll state, mobile sheet with focus trap), `Hero` + `HeroFinder`, `CraftsSection`, `CreatorStory`, `LooksSection`, `TalentSection` (async server component in `Suspense`, with loading, error and empty states), `RequestSection`, `TrustSection`, `ProsSection`, `BrandStatement`, `LandingFooter`, plus primitives `SmomoMark` / `SmomoLockup`, `EditorialImage`, `Reveal`.

Design notes:

- Space Grotesk is loaded only by the landing chrome (`components/landing/fonts.ts`); DM Sans already comes from the root layout.
- `landing.css` is unlayered, so it beats Tailwind's layered utilities. Do not put a `display` utility on an element that also has `.sm-btn`.
- The landing page is a fixed light design. It ignores the app's dark theme.

## Brand assets used

- Approved symbol: `docs/brand/smomo_symbol_approved_original.png` (source of truth) and `smomo_symbol_ink_transparent.png`. The web masks `apps/web/public/brand/smomo-symbol-{256,640,1280}.webp` are those pixels, cropped and resized only. The symbol is rendered as an alpha mask coloured by `currentColor`, so it is never redrawn or altered. The handoff's `smomo_symbol_trace.svg` is an auto-trace approximation and is deliberately not used.
- Wordmark: lowercase `smomo`, Space Grotesk 700, typeset beside the symbol.
- Regenerating masks: crop the ink-transparent PNG with `sharp(...).trim()`, then `.resize({ width })` and `.webp({ lossless: true })` for each width.

## Images and placeholders (action needed)

There is no licensed or commissioned photography in the repo. The existing `/public/samples/*` files are third-party images (one has a visible watermark), so **none are used** on the new page. Each slot is a labelled placeholder naming its asset ID and art direction (IDs follow `visual_asset_briefs.md` in the rebrand handoff):

`V01` hero desktop · `V02` hero mobile · `V03–V07` the five crafts · `V08–V10` creator story · `V11` pros banner · `L01–L08` "looks" grid.

To ship a photo: add it under `apps/web/public/editorial/`, set `src` on the matching entry in `ASSETS` (`landing-content.ts`) and keep the alt text accurate. Layout space is already reserved. For the hero, set `src` on **both** `heroDesktop` and `heroMobile`; the component then renders a `<picture>` with art direction (this path is written but untested until photos exist). The "looks" tiles (`LOOK_TILES`) still need an `src` field wiring when real portfolio images are available.

## Honesty decisions

- **Provider cards** show only what the public API returns: name, crafts, photo and a starting price when one exists. **Ratings, review counts and jobs-done are intentionally not shown.** The live API currently lists five providers; four have seed-style slugs (`…-a000`), Unsplash avatars, round-number ratings and portfolios made of the `/samples` stock files. I could not verify review integrity (no database access), so they're omitted rather than presented as real. Purge or replace the seed data before launch.
- **Trust section** claims were checked against the code. The SA ID check is a format (Luhn) check and is described as exactly that, not as identity verification. PayShap is described as peer-to-peer with SMOMO recording payments. No claim about cost, refunds or guaranteed bookings is made.
- **"Made by Apex Motus" and "Looks worth saving"** show labelled placeholders only: no invented creator names, quotes, save counts or likes.
- **Footer**: there are no Privacy, Terms, support or social pages or verified contact details in the product. They're listed as "(to be published)" rather than linked to nothing.

## Destinations (all existing routes)

| CTA                              | Goes to                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Explore Talent (finder)          | `/{category}` or `/{category}/{city}` (public listings)                                                            |
| Post Your Look                   | `/app/request/new` (signed-out visitors go to `/login?next=…` and return)                                          |
| Explore All Talent               | `/app/discover` (same auth redirect; there is no public all-crafts directory)                                      |
| Meet the Creators                | `#talent` on the page                                                                                              |
| Join as a Pro                    | `/register?next=/app/studio` (existing provider onboarding); "Open your studio" → `/login?next=/app/studio`        |
| Log In / Join SMOMO              | `/login` / `/register`                                                                                             |
| How It Works / For Professionals | `/how-it-works` / `/how-it-works#pros`                                                                             |
| Crafts, cities, footer           | `/hairdressers`, `/nail-technicians`, `/makeup-artists`, `/beauticians`, `/tattoo-artists`, `/city/*`, `/download` |

## Known follow-ups (outside this landing-only scope)

1. Inner pages keep the old violet chrome and Cormorant type until their phases. Clicking through from the landing page is a visible brand change.
2. `PwaProvider`'s install banner still uses the old violet icon and shows on the landing page. PWA/favicon icons (`public/icons/*`, `apple-touch-icon.png`, `favicon.ico`) still carry the old mark.
3. Publish Privacy, Terms and support pages, and confirm contact and social handles.
4. Pre-existing `react-hooks/set-state-in-effect` lint error in `SiteHeader.tsx` (the old header's `useEffect`) is untouched.
5. **Lighthouse (production build, run locally, 11 Oct 2026).** Accessibility, Best Practices and SEO: 100 on mobile and desktop. Desktop performance: 94–100 (LCP 0.8–0.9 s, CLS 0–0.008). **Mobile performance: 65–77 across runs (median ~72), below the 90 goal.** The live homepage measured ~68–71 under the same conditions, so this is roughly parity, not a miss caused by the new page. Mobile LCP (~4.7 s simulated) is the paragraph waiting on the shared font swap: the root layout preloads six font files (Cormorant and DM Mono are unused on this page) and loads app-wide JS (React/Next runtime, react-query and PWA providers). Trimming the root layout's fonts/providers is the next lever and is outside this landing-only scope. Lighthouse here varies ±10 between identical runs, so re-measure on the deployed preview.

## Deploying to Vercel safely

1. Push the branch (`git push -u origin feat/smomo-2-landing`). If the Vercel project is Git-connected, that creates a **Preview** deployment only. Production is untouched.
2. Smoke-test the preview: `/`, finder → a category/city page, `/login`, `/register`, `/app/request/new` (should redirect to login with `next`), a `/pro/{slug}` page, mobile menu, 320/390/820/1440 widths.
3. Replace placeholders and seed data as above, or accept them knowingly.
4. Only after explicit approval: merge to `main` (or `vercel --prod`). Roll back by promoting the previous deployment in the Vercel dashboard.

---

## Phase 2 (13 Oct 2026): photography, site-wide rebrand, registration fix

**Photography.** The 21 supplied images (one was a byte-identical duplicate) are converted to WebP in `apps/web/public/editorial/` and wired through `ASSETS` / `LOOK_TILES` in `landing-content.ts`, and `CATEGORY_IMAGE` / `CATEGORY_HERO` in `lib/catalog.ts`. They are campaign imagery, not any provider's portfolio, so they carry no creator attribution. Several appear to be AI-generated; disclose that if your policy requires it. The `/public/samples` files are no longer referenced by any page (they remain in the repo and are still what the seeded providers' portfolios point at).

**Site-wide rebrand.** Done centrally, not page by page:

- Token **names** in `globals.css` are unchanged; their **values** are now the SMOMO palette (light and dark), with Space Grotesk headings. Every page, including the signed-in app, picks it up.
- `BrandLogo` now renders the new symbol and wordmark everywhere. `SiteHeader` / `SiteFooter` are the new header and footer on every public page (the header shows "My SMOMO" when signed in).
- Sign-in layout, login, register, provider setup, error page, PWA icons, favicon and manifest are rebuilt in the brand.
- Public pages are always light. The signed-in app (`/app`) still follows the user's theme toggle / OS setting.
- Cormorant and DM Mono are no longer loaded (fewer font downloads).

**Registration fix.** Root cause: sign-up created the account first, then saved the profile and ID in two separate API calls. If either failed (for example the mobile number was already in use), the account was left half-created, and retrying then failed with "email already registered", so the person was stuck. Now:

- A retry with the same email and password signs in and continues from where it stopped.
- Duplicate mobile/ID errors appear on the field, with the account kept, so the person just edits and continues.
- "Looking for a pro / A beauty pro" choice on step 1 (also `/register?as=pro`); pros land in studio setup after registering.
- A different person's existing session is signed out first, so their profile is never overwritten. Already-registered, signed-in visitors are redirected away from `/register`.
- SA ID numbers are normalised (spaces allowed) and clearer error messages are shown.
- Provider setup form has proper labels, guidance and inline validation.

Verified against the live Supabase and API with synthetic accounts: client sign-up, resume after partial failure, and pro sign-up through to a created studio (30-day trial).

**Ratings switch.** `lib/flags.ts`: public listings and `/pro/[slug]` hide ratings, review text, job counts and the schema.org `aggregateRating` unless `NEXT_PUBLIC_SHOW_RATINGS=true`. Reason: the listed providers include seed accounts. Signed-in app screens are unchanged.

**Test accounts to delete** (created on the live Supabase while diagnosing; they use `example.com` addresses, password `Diag-Test-123456`): `smomo.diag.<timestamp>@example.com` (one), `smomo.diag.browser1@example.com`, `smomo.diag.pro1@example.com`, `smomo.diag.client2@example.com`. `smomo.diag.pro1` has a studio ("Diag Test Studio"); it is not publicly listed because it isn't verified.

**Not done / needs you:** the API at `smomo-api.vercel.app` lives in a different Vercel account (not accessible from here), so no API change was made or needed. Password reset and email-based flows are not built (no email sender is configured yet). The auth rate limits and "email confirmation" setting live in the Supabase dashboard.
