# Smomo — UI restyle spec

**Target:** `apps/web` (Next.js App Router + Tailwind v4)
**Scope:** visual restyle only.
**Version:** 1.0

---

## 0. Rules of engagement (read first)

1. **Do not change the flow.** No routes added, removed or renamed. No changes to navigation order, redirects, or middleware. No changes to what a page does, what it fetches, or when it renders.
2. **Do not change logic.** No changes to hooks, react-query calls, Supabase queries, mutations, form validation, state shape, or event handlers. If a diff touches anything inside a `useEffect`, `useMutation`, `useQuery`, `onSubmit` or an API call, it is out of scope.
3. **Do not change component APIs.** Every exported component keeps its name, its props and its prop types. `<Button href variant>`, `<Badge tone>`, `<Avatar name size>`, `<Card className>` all stay exactly as they are — only the classes they emit change.
4. **Do not rename design tokens.** The token names in `globals.css` (`--color-card`, `--color-text-muted`, `--color-border`, `--color-primary-soft`, …) stay. Only their *values* change, plus a few new tokens are added. This is what lets untouched pages inherit the new look for free.
5. **Copy stays as written** except where this spec explicitly says to remove an emoji. Do not rewrite headings or body copy.
6. **Accessibility floor:** body text keeps ≥4.5:1 contrast. Never set paragraph-size text in `--color-primary` on the light ground — use `--color-primary-700`.

Work file by file in the order below. Each step is independently shippable.

---

## 1. The direction in one paragraph

Smomo moves from a rounded, filled, emoji-led app look to an **editorial one**: Cormorant Garamond headings over Lora body text, a near-white ground, hairline rules carrying the structure, and colour applied as *stroke* rather than *fill*. Buttons become outlined. Cards stay bordered and unfilled. Radius drops from 16px to 4px. Deep violet #6D28D9 remains the brand colour but stops being a background — it becomes borders, rules, small marks and text. Rose gold #D4AF7C is the only secondary and appears only as stars and hairline accents. Photographs are matted in a thin border ("plate") instead of running full-bleed. Emoji are removed.

---

## 2. Tokens — `src/app/globals.css`

Replace the file with the following. Token names are unchanged; values and type are new.

```css
@import "tailwindcss";

@theme {
  /* Ground & ink */
  --color-bg: #faf9fc;
  --color-card: #ffffff;
  --color-card-muted: #f7f6fa;
  --color-text: #1a1523;
  --color-text-muted: #5c5568;
  --color-text-faint: #9a93a6;
  --color-border: #e5e1ee;

  /* Deep violet — the brand primary */
  --color-primary: #6d28d9;
  --color-primary-dark: #5b21b6;
  --color-primary-soft: #ede9fe;
  --color-primary-100: #f6f3fe;
  --color-primary-200: #ede9fe;
  --color-primary-300: #d9cdfb;
  --color-primary-400: #b79cf3;
  --color-primary-500: #8b5cf6;
  --color-primary-600: #6d28d9;
  --color-primary-700: #5b21b6;
  --color-primary-800: #46199a;
  --color-primary-900: #2e1065;

  /* Rose gold — stroke and small marks only, never a fill */
  --color-accent: #d4af7c;
  --color-accent-deep: #a2783f;
  --color-star: #bf945c;

  --color-success: #16a34a;
  --color-danger: #dc2626;

  /* Type */
  --font-heading: var(--font-cormorant), Georgia, "Times New Roman", serif;
  --font-body: var(--font-lora), Georgia, serif;
  --font-mono: ui-monospace, Menlo, Consolas, monospace;
  --font-sans: var(--font-lora), Georgia, serif; /* alias: existing font-sans usages inherit */

  --radius-brand: 4px;
}

html { background: var(--color-bg); color: var(--color-text); }

body {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  text-wrap: pretty;
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.12;
}
h1 { font-weight: 400; }   /* the bigger the type, the lighter it sets */

.tnum, th, td, time { font-variant-numeric: tabular-nums; }

.kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-primary-700);
}

.hr { height: 1px; border: 0; background: var(--color-border); margin: 0; }

.plate { padding: 6px; background: var(--color-card); border: 1px solid var(--color-border); }
.plate > img { display: block; width: 100%; height: auto; }

:where(a, button, input, select, textarea, [tabindex]):focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

::selection { background: var(--color-primary-200); color: var(--color-primary-900); }
```

**Removed token:** `--color-accent: #db2777` (pink). Any usage now resolves to rose gold. Grep for `text-accent` / `bg-accent` and check each hit reads sensibly; if it was signalling *danger* or *sale*, use `--color-danger` instead.

---

## 3. Fonts — `src/app/layout.tsx`

Load via `next/font/google`; no install needed.

```tsx
import { Cormorant_Garamond, Lora } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'], weight: ['300','400','500','600'], variable: '--font-cormorant',
});
const lora = Lora({
  subsets: ['latin'], weight: ['400','500','600'], style: ['normal','italic'], variable: '--font-lora',
});
```

Then: `<html lang="en" className={`${cormorant.variable} ${lora.variable}`}>`.

Do not change anything else in the metadata export.

---

## 4. Global find-and-replace rules

Apply these across `src/**`. They are mechanical and safe; each is a class-string change only.

| Find | Replace with | Why |
| --- | --- | --- |
| `rounded-2xl`, `rounded-xl` | `rounded` | 4px radius |
| `rounded-full` on **pills/chips/tabs** | `rounded` | chips are rectangular now |
| `rounded-full` on **avatars and status dots** | keep | circles stay circles |
| `font-extrabold`, `font-bold` on headings | delete (the `h1–h4` rule supplies weight) | no bold display type |
| `font-bold` / `font-semibold` on **body spans** | `font-medium`, or delete | emphasis via italic/size, not weight |
| `bg-primary text-white` | `border border-primary text-primary-700 hover:bg-primary-100` | outlined, not filled |
| `hover:bg-primary-dark` | `active:bg-primary-200` | pressed state from the ramp |
| `bg-primary-soft` used as a **section background** | `border-y border-border` + keep the ground | no large fills |
| `bg-primary-soft` used as a **chip/badge tint** | `border border-primary-300 bg-primary-100 text-primary-700` | tint + stroke |
| `hover:shadow-md`, `shadow-md` | `hover:bg-primary-100` (cards) or delete | elevation is a whisper |
| `text-star` | keep (now rose gold) | — |
| Numeric spans (prices, ratings, distances, counts) | add `tnum` | tabular figures |

**Disabled states:** keep `disabled:opacity-50`.

**Selected/active states** on tabs, category chips and segmented controls — the pattern `border-primary bg-primary text-white` becomes:

```
border-primary bg-primary-100 text-primary-700
```

and the unselected `border-border bg-card` stays as is.

---

## 5. Emoji removal

Emoji are off-system. Three sources:

1. **`src/lib/catalog.ts` → `CATEGORY_EMOJI`.** Keep the export (other code imports it) but stop rendering it. Alternatively swap to Lucide icons — `Scissors` (hairdressers), `Sparkles` (nail technicians), `Brush` (make-up artists), `Flower2` (beauticians), `PenTool` (tattoo artists) — at 16px, `stroke-width: 1.5`, `text-primary-700`.
2. **`@smomo/shared` → `categoryEmoji()`.** Called in `DiscoverProviderCard`, `app/page.tsx`, `booking/[id]`, `feed`, `chats`, `schedule`, `request/[id]`, `provider/[id]`. Replace `{categoryEmoji(c)} {categoryLabel(c)}` with `{categoryLabel(c)}` — do not modify the shared package.
3. **Inline literals:** `💅 Smomo` in `layout.tsx` and `AppNav.tsx` (replace with the logo image / plain wordmark), `💅✨🖋️` in `app/page.tsx` hero, `👋` in `ChatPanel` empty state, `✅` in `report/page.tsx` success state.

For `DiscoverProviderCard`, the categories line becomes `{p.categories.map(categoryLabel).join(' · ')}`.

---

## 6. Brand assets

`public/assets/Smomo_logo_light.png` and `Smomo_logo_dark.png` have an opaque near-white ground and a baked-in "LIGHT VARIANT" / "DARK VARIANT" caption. Use the supplied `assets/Smomo_logo_light.png` (caption trimmed, ground keyed to transparency) — copy it over the original. Do the same for the dark variant if you need it outside a violet panel.

Usage:

- **Header (`layout.tsx`, `AppNav.tsx`):** light logo, `h-9 w-auto`, wrapped in a `<Link href="/">` with `aria-label="Smomo"`.
- **Footer:** light logo at `h-10`, with the cue line beneath in mono caps: `Hair ✦ Nails ✦ Make-up ✦ Beauty ✦ Tattoo`.
- **Hero / brand splash:** dark logo centred on `bg-primary-900`, inside a `.plate`.
- **Never** place the logo on a mid-tone or photographic background.

---

## 7. Component-by-component

### 7.1 `src/components/ui.tsx`

Keep all exports and props. Changes:

- `Card` — `rounded-2xl` → `rounded`. Keep `border border-border bg-card p-5`.
- `Badge` — outlined tints, `rounded-full` → `rounded`, drop `font-semibold`:
  - `default`: `border-border bg-card text-text-muted`
  - `primary`: `border-primary-300 bg-primary-100 text-primary-700`
  - `success`: `border-green-200 bg-green-50 text-success`
  - `danger`: `border-red-200 bg-red-50 text-danger`
- `Button` — outlined both variants:
  - `primary`: `border border-primary text-primary-700 hover:bg-primary-100 active:bg-primary-200`
  - `outline`: `border border-border text-text hover:bg-card-muted active:bg-border`
  - shape: `rounded px-5 py-3 text-sm` (drop `font-semibold`)
- `Stars` — add `tnum` to the wrapper. Stars now read rose gold via `--color-star`.
- `Avatar` — `bg-primary-soft` → `border border-border bg-primary-100`, `font-bold` → heading font, `text-primary` → `text-primary-700`.
- `SectionHeading` — drop `font-bold`, add a `<Hairline className="mt-4" />` under the subtitle.

**Add three primitives** (new exports, nothing else imports them yet):

```tsx
export function Hairline({ className = '' }) { return <hr className={`hr ${className}`} />; }
export function Kicker({ children }) { return <p className="kicker">{children}</p>; }
export function Plate({ children, className = '' }) { return <div className={`plate ${className}`}>{children}</div>; }
```

### 7.2 `src/app/layout.tsx`

- Logo image replaces `💅 Smomo`.
- Nav links: `hover:text-text` → `border-b border-transparent pb-0.5 hover:border-primary hover:text-text` (underline on hover, no colour fill).
- "How it works" button: outlined per §4.
- Footer: logo + cue line + `<hr className="hr" />` + copyright. Drop `font-semibold`.

### 7.3 `src/app/page.tsx` (marketing home)

Layout changes only — same sections, same order, same links.

- Hero: two columns. Left = kicker (`Hair ✦ Nails ✦ Make-up ✦ Beauty ✦ Tattoo`), `h1`, lede, hairline, the two existing buttons. Right = `.plate` holding the dark logo on `bg-primary-900`. Remove the `bg-primary-soft` full-width band and the emoji line.
- Categories: 3-up cards with a one-line note under each label instead of an emoji tile. Note keys use the real slugs: `hairdressers`, `nail-technicians`, `makeup-artists`, `beauticians`, `tattoo-artists`.
- How it works: three columns parted by `sm:border-l border-border`, each numbered `01/02/03` in mono caps.
- Cities: `rounded-full` chips → `rounded`.

### 7.4 `src/components/AppNav.tsx`

- `💅 Smomo` + `font-extrabold` → logo image at `h-7 w-auto`.
- Active/hover nav item: underline via `border-b border-primary`, never a filled pill.
- Everything else (the `isPractitioner` / `isAdmin` conditionals, link order, `SignOutButton`) unchanged.

### 7.5 `src/components/DiscoverProviderCard.tsx` & `ProviderListCard.tsx`

- `hover:shadow-md` → `hover:bg-primary-100`.
- `font-semibold` on the business name → heading font at `text-lg`.
- Online dot: keep `rounded-full bg-success`.
- Distance and price spans get `tnum`.
- Categories render as labels joined with ` · ` (no emoji).

### 7.6 `src/components/ChatPanel.tsx`

Visuals only — leave the Supabase subscription, the send handler and the `useEffect`s alone.

- Container: `rounded-2xl` → `rounded`.
- Mine: `bg-primary text-white` → `border border-primary-300 bg-primary-100 text-text`.
- Theirs: `bg-card-muted` → `border border-border bg-card`.
- Bubbles: `rounded-2xl` → `rounded`.
- Input: `rounded-xl` → `rounded`. Send button: outlined per §4.
- Empty state: drop the `👋`.

### 7.7 Auth pages — `(auth)/layout.tsx`, `login`, `register`

- Card: `rounded-2xl` → `rounded`; `font-extrabold` wordmark → logo image.
- Inputs: shared `inputCls` becomes `w-full rounded border border-border bg-card px-4 py-3`.
- Submit buttons outlined per §4; keep `disabled:opacity-50`.
- The `nationality` segmented control uses the selected-state pattern from §4.

### 7.8 App pages

Mechanical only — §4 plus §5. Files: `app/page.tsx`, `app/discover`, `app/chats`, `app/feed`, `app/schedule`, `app/studio` (+ `services`, `portfolio`), `app/profile`, `app/request/new`, `app/request/[id]`, `app/booking/[id]`, `app/provider/[id]`, `app/admin`, `app/report`.

Three page-specific notes:

- **`app/discover`** — the "Post a request" card is `bg-primary text-white`. Make it `border border-primary bg-primary-100 text-primary-700`. Keep it a link to `/app/request/new`.
- **`app/booking/[id]`** — the review star picker uses `text-3xl` with `text-primary`/`text-text-faint`. Switch the selected colour to `text-star` (rose gold); keep the size and the click handler.
- **`app/profile`** — the badge overlay `rounded-full bg-primary px-2 py-0.5 text-white` becomes `rounded border border-primary-300 bg-primary-100 text-primary-700`.

### 7.9 Public SEO pages — `[category]`, `[category]/[city]`, `city/[city]`, `pro/[slug]`, `how-it-works`

- `text-3xl font-extrabold` → `text-4xl` (weight comes from the `h1` rule).
- City chips: `rounded-full` → `rounded`.
- `pro/[slug]` portfolio images: wrap in `.plate` instead of `rounded-xl`; keep `aspect-square object-cover`.
- `pro/[slug]` closing CTA `rounded-2xl bg-primary-soft p-8` → `border border-border p-8` on the page ground.
- `how-it-works` step titles: `font-bold text-primary` → `text-primary-700` in the heading font.

---

## 8. Definition of done

- [ ] No route, redirect, data-fetch, mutation or handler was modified.
- [ ] Every exported component has the same name, props and types as before.
- [ ] No `bg-primary` remains as a large fill; primary appears as border, rule or text.
- [ ] No `rounded-xl` / `rounded-2xl` remains; `rounded-full` survives only on avatars and status dots.
- [ ] No emoji render anywhere in `src/**`.
- [ ] Cormorant Garamond renders on all `h1–h4`; Lora on body.
- [ ] Prices, ratings, distances and dates render with tabular figures.
- [ ] Keyboard focus shows the 2px violet ring on every interactive element.
- [ ] Body copy passes 4.5:1 on the `#faf9fc` ground.
- [ ] `pnpm build` (or `npm run build`) passes with no new type errors.

---

## 9. Reference files

Four already-converted files ship alongside this spec as worked examples: `globals.css`, `ui.tsx`, `layout.tsx`, `page.tsx`. They are drop-in replacements for `src/app/globals.css`, `src/components/ui.tsx`, `src/app/layout.tsx` and `src/app/page.tsx`. Use them as the pattern for everything in §7.8 and §7.9.
