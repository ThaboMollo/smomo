# SMOMO Console (`apps/admin`)

A standalone Next.js app for the two audiences who administer something on SMOMO:

| Audience | Sees |
|---|---|
| **Professional** (`profiles.is_practitioner`) | Their own business — studio, services, portfolio, offers, bookings, earnings |
| **Staff** (`profiles.is_admin`) | Additionally the platform sections — pro verification, reports, payment disputes, providers & users, metrics |

Professionals are sent here with a link after they finish registering. Staff accounts are
granted by setting `profiles.is_admin = true`; there is no sign-up form on purpose.

## Run it

```bash
pnpm admin          # http://localhost:3001
```

`apps/admin/.env.local` needs the same four values as the web app (Supabase URL + anon key,
and the API URL for both server and browser). It is gitignored, so a new checkout copies it
from `apps/web/.env.local`.

## How it is put together

- **Auth** is the same Supabase session as every other surface — one account, several
  surfaces. `src/proxy.ts` (Next 16's replacement for `middleware.ts`) closes the whole app
  by default and lists `/login` as the only exception, so a new route is private the moment
  someone adds it rather than when they remember to list it.
- **Role** is resolved in `src/lib/session.ts` by reading `profiles` with the caller's own
  session, so RLS applies. `requireStaff()` renders a 404 rather than a "forbidden" page, so
  the console does not confirm which routes exist to someone who should not see them. The
  database re-checks `is_admin()` inside every staff RPC regardless — the role gate here is
  the fast path, not the boundary.
- **Theming** comes from `@smomo/ui-tokens/theme.css`, the same stylesheet the consumer web
  app imports, so the two cannot drift. `src/app/globals.css` adds the console register on
  top: 10px panels instead of 20-28px, dense tables, square status tags, 34px buttons, and
  headings in the body face rather than the display one. The shared primitives (`.btn`,
  `.input`, `.chip`) are untouched, so a component moved between the two apps keeps its
  shape.
- **No emoji.** `pnpm lint:emoji` fails the build on any emoji or bare symbol glyph; use the
  inline SVG icons.

## What works

- Sign-in, the closed-by-default proxy gate, and role resolution.
- The console shell: sidebar (role-gated), top bar, theme toggle, sign-out, and an
  unverified-account banner for pros.
- **Overview** — role-aware counts. A pro sees their pipeline and earnings; staff see what
  is waiting on them.
- **Platform → Verification** — the queue. Filter by status, see each pro against the ID on
  file (masked to the last four digits), their categories, base and registration date, then
  approve or reject. A rejection requires a reason, which the pro is shown.

Verification needs **migration 18** applied before the buttons do anything; the RPC is what
writes `verification_status`, and nothing else can.

## Not built yet

- Professional sections: studio, services, portfolio, offers, bookings, earnings.
- Platform sections: metrics, reports, disputes, providers & users.
- Moving `/app/studio`, `/app/feed` and `/app/schedule` out of the consumer web app and
  redirecting them here.
- A Vercel project for this app and its own domain.

## Known gap

The Supabase client here is not parameterised with `<Database>`, so reads are unchecked.
See the note in `src/lib/supabase/client.ts` — supabase-js currently infers
`.from('practitioner_profiles').select('id')` as `never`, which is pre-existing and affects
the whole repo (no app types its client). Ruled out: the PostGIS `unknown` columns and the
`PostgrestVersion` value.
