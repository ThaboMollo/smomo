# Mobile brand parity: bringing the app up to SMOMO 2.0

The web was rebranded to SMOMO 2.0 in two phases (see `smomo-2-landing.md`). Phase 2 did it
centrally: the token **names** in `apps/web/src/app/globals.css` stayed, their **values** moved to
the SMOMO palette, and every web page — including the signed-in app — inherited it.

The mobile app was never part of that work. It reads from a different source
(`@smomo/ui-tokens`) that still holds the pre-rebrand violet palette, so the two products now look
like different brands. This document is the plan to close that gap.

## The gap

| | Web (SMOMO 2.0) | Mobile (before this work) |
| --- | --- | --- |
| Token source | `apps/web/src/app/globals.css` `@theme` | `@smomo/ui-tokens` → `src/lib/theme.ts` |
| Ground | Warm Canvas `#F4EFE7` | `#FAF9FC` cool white |
| Ink | Midnight Ink `#251719` | `#1A1523` |
| Brand | Signature Pink `#E64D74` / deep `#AA204A` | Plum `#6D28D9` |
| Accents | Soft Lilac `#C7B1F3`, Electric Lime `#CCF36D` | Berry `#DB2777` |
| Type | Space Grotesk 700 display + DM Sans body | System fonts; nothing loaded |
| Stars | Pink-deep, one star + number | Gold `#F5A623`, five stars |
| Buttons | Pill, ink-on-pink, 2px border, 44px min | 12px radius, white-on-plum |
| Cards | 24px radius | 16px |
| Selected chip / segment | **Ink** fill | Plum fill |
| Icons | Custom 1.75-stroke outline | Filled Ionicons |
| Brand mark | Approved symbol as an alpha mask | 💅✨ emoji |
| Category art | 20 editorial photographs | Emoji |

## Why this is cheaper than it looks

Two properties of the mobile codebase make a central swap possible, the same way it was possible on
web:

1. **There is no hardcoded hex in any mobile `.tsx` file.** Every screen reads `useTheme()`.
   Changing the token values re-skins all 28 screens at once.
2. **The web does not import `@smomo/ui-tokens`.** It is declared in `apps/web/package.json` but
   never imported anywhere in `apps/web/src`, so the package is mobile-only in practice and can be
   repointed to the new brand with no risk to the web.

Everything funnels through two files: `packages/ui-tokens/src/index.ts` and
`apps/mobile/src/ui.tsx` (imported by 28 files). Those are the whole job.

A third finding shapes Phase 6: `src/constants/theme.ts`, `src/hooks/use-theme.ts`,
`src/hooks/use-color-scheme.ts` and `src/hooks/use-color-scheme.web.ts` are orphaned Expo-template
leftovers that only reference each other. They are also the only remaining hardcoded colors in
mobile, which is why they must go rather than be updated.

## Phase 1 — Repoint the tokens

File: `packages/ui-tokens/src/index.ts`

Replace the palette with the SMOMO values, keeping every existing `AppColors` key name so no screen
breaks. Light values come from the `@theme` block in `globals.css`; dark values from its
`html[data-theme='dark']` block.

**The pink split matters.** Web's `.btn-primary` is ink on Signature Pink (`#E64D74`, 4.7:1)
because white on that pink fails contrast at button size, while `--color-primary` (`#AA204A`) is the
darker pink that *does* pass with white. Mobile's `Button` renders `primary` as background and
`onPrimary` as foreground, so mapping naively would produce the wrong pair. The tokens therefore
carry both:

- `primary` `#AA204A` — text, icons and accents on canvas; passes AA
- `pink` `#E64D74` — button and fill surfaces only
- `onPink` `#251719` — ink text that sits on pink

Add web's three most-used pink steps so the app chrome can match (web's nav active pill is
`bg-primary-200` + `text-primary-700`, and its `Avatar` fallback is the same pair):

- `primarySoft` = web `primary-100`
- `primaryMuted` = web `primary-200`
- `primaryStrong` = web `primary-700`

Carry the brand directs through as well: `ink`, `canvas`, `lilac`, `lime`.

Five tokens mobile needs have no web equivalent (`successSoft`, `warning`, `warningSoft`,
`dangerSoft`, `overlay`). Derive these in the warm brand family rather than keeping the violet-era
values. `online` should equal `success`, because web's online dot uses `bg-success`.

Widen the radius scale to web's actual shapes — inputs 14, thumbnails 18, cards 24, brand 28,
buttons `pill`. Mobile's 12px buttons becoming pills is the single biggest shape change in the
upgrade.

## Phase 2 — Typography

Mobile loads no fonts at all; `expo-font` is a dependency but unused. Add
`@expo-google-fonts/space-grotesk` and `@expo-google-fonts/dm-sans`, load them in
`app/_layout.tsx` gated on the splash-screen hold that already exists there, then map `AppText`
variants:

- `display` / `title` / `heading` → Space Grotesk 700, negative tracking (web uses `-0.035em` to
  `-0.04em`; React Native needs absolute px, so roughly `-1.4` at 34px)
- `body` / `small` / `caption` → DM Sans
- add a `kicker` variant for web's uppercase 12px / `0.14em` labels

## Phase 3 — Component kit

File: `apps/mobile/src/ui.tsx`

Port the behaviours, not only the colours:

- `Button` → pill, ink-on-pink, pressed state darkens toward ink
- `Chip` and `Segmented` selected → **ink** fill. Web's selected states are ink, not pink; this is
  easy to get wrong by assuming the brand colour.
- `Badge` → add the border web has
- `EmptyState` → dashed `primary-300` container with the Sparkle, instead of a bare emoji
- `StarRating` → pink-deep; compact one-star-plus-number for cards, five stars kept for the review
  input
- add `Skeleton` — web has an animated one, mobile only has a spinner

## Phase 4 — Brand mark and chrome

Replace the 💅✨ in `app/(auth)/welcome.tsx` with the real mark. Web renders the approved symbol as
a CSS alpha mask so it takes any flat brand colour without being redrawn; React Native cannot do
CSS masks, but `expo-image` is already a dependency and supports `tintColor`, which preserves that
same property. Bundle `docs/brand/smomo_symbol_ink_transparent.png` and tint it.

Then `app.json`: splash `backgroundColor` `#6D28D9` → ink, and Android
`adaptiveIcon.backgroundColor` `#EDE9FE` → canvas. New launcher-icon artwork drawn from the symbol
is a design dependency, not a code one.

## Phase 5 — Icons and imagery

Switch Ionicons to the `-outline` variants to match web's stroke icons, with filled-on-active in
both `_layout.tsx` tab bars.

Mobile shows emoji where web shows editorial photography. The 20 WebP files live only in
`apps/web/public/editorial/`. Serve them from the web origin rather than bundling them: they would
bloat the binary, and `expo-image` handles WebP and caching. This trades a network dependency for
bundle size.

## Phase 6 — Cleanup and parity

Delete the dead theme cluster (`constants/theme.ts`, `hooks/use-theme.ts`, both
`use-color-scheme` files) and the template assets (`react-logo*`, `expo-badge*`, `logo-glow`).

Optionally add a persisted theme toggle. Web's signed-in `/app` has one backed by `localStorage`;
mobile follows the OS only. AsyncStorage is already a dependency.

## Decisions taken

- **Dark mode stays.** Web's *public* pages are locked light, but `/app` keeps its theme toggle, and
  mobile is entirely signed-in surface. Mobile follows `/app`, not the marketing pages.
- **`@smomo/ui-tokens` is repointed rather than forked**, because the web does not import it.
- **Editorial imagery is served, not bundled** (Phase 5).

## Implementation log (23 Oct 2026)

All six phases are implemented. `pnpm turbo run typecheck` passes across all nine workspace
tasks, `expo lint` reports no problems in any changed file, and `expo export --platform ios`
bundles. The shipped Hermes bundle contains every SMOMO 2.0 value (`#E64D74`, `#F4EFE7`,
`#251719`, `#AA204A`, `#CCF36D`, `#C7B1F3`) and none of the old plum palette (`#6D28D9`,
`#EDE9FE`, `#FAF9FC`, `#1A1523`, the gold star `#F5A623`), which confirms the token swap reached
the app rather than only the source.

### Deviations from the plan

1. **The Sparkle is an Ionicon, not the brand's four-point mark.** The web draws it as an inline
   SVG path; React Native would need `react-native-svg`, which is not a dependency and would mean
   a new native module and a rebuild for one decorative glyph. `EmptyState` uses Ionicons
   `sparkles` in `primary`. Adding `react-native-svg` later is a one-component change.
2. **`EmptyState` keeps each caller's emoji.** The plan said to adopt web's single Sparkle, but all
   twelve call sites pass a contextual glyph (💤 offline, 🤷 not found, 💬 no chats) that carries
   information the web's uniform sparkle does not. The web's *container* was adopted — dashed
   `primary-200` border, 24px radius, card ground — and the glyph kept. The sparkle is the
   fallback when no emoji is given.
3. **Launcher icons were generated, not left as a design dependency.** The approved symbol was
   trimmed, resized and recoloured by its alpha only — never redrawn — and composed on the brand
   ground, reproducing `apps/web/public/icons/icon-512.png` exactly. This also removed the Expo
   template logo, which was still shipping as the iOS icon via `assets/expo.icon`.

### Also changed

- `app/(auth)/welcome.tsx` led with 💅✨ and "Welcome to Smomo". It now leads with the real lockup,
  so the heading beneath it would have repeated the name; it reads "Your look. Your people.",
  which is the web's own title. This is a copy change, not only a visual one.
- `ProviderCardView` was rebuilt to match web's `DiscoverProviderCard`: a 96px editorial photo with
  an 18px radius instead of a circular avatar, crafts as text rather than emoji, "Verified" as a
  quiet pink pill rather than a green success badge, and the price in `primaryStrong`.
- `StarRating` display is now one star plus the number. Its five-star form is kept only where
  `onChange` is passed, which is the review input.
- A new `EXPO_PUBLIC_SITE_URL` (default `https://smomo.vercel.app`) points at the origin serving
  the editorial photography. It was appended to `apps/mobile/.env`; it also needs setting wherever
  the app is built for release.

### Not verified

The app was not run on a simulator or device — the Chrome tooling for a visual pass was
unavailable, and Expo's static web export fails at SSR prerender because `expo-secure-store` has no
Node implementation (a pre-existing limitation, unrelated to this work). Everything above is
verified by typecheck, lint and bundle contents, not by looking at it. **Run it on a device before
merging**, and check in particular: Space Grotesk's negative tracking at `display` size, the
ink-on-pink button contrast in dark mode, and the dashed `EmptyState` border, which React Native
renders less consistently than CSS across platforms.

### Pre-existing issues left alone

`expo lint` reports 11 errors that predate this work: unescaped apostrophes in
`discover.tsx`, `profile.tsx`, `feed.tsx`, `booking/[id].tsx`, `new-request.tsx`, `offer/[id].tsx`
and `portfolio.tsx`, plus "Cannot call impure function during render" at `new-request.tsx:35`.
That last one is a real React Compiler correctness warning and worth fixing separately.

## Constraint

Expo 57 / React Native 0.86 / React 19.2 is recent, and `apps/mobile/AGENTS.md` requires reading the
versioned docs at `https://docs.expo.dev/versions/v57.0.0/` before writing code. The font-loading
API (Phase 2) and `expo-image`'s `tintColor` (Phase 4) should be checked against those docs rather
than from memory.
