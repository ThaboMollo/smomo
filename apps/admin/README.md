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

Every section in the sidebar is built.

**Professional**
- **Overview** — pipeline and earnings at a glance.
- **My studio** — business profile, categories, how you work, deposit, socials; base
  address and city; online/offline. A rejected pro sees the staff note explaining why.
- **Services** — add, edit, hide and remove, with the "typical price" that feeds the
  `from R…` figure on a public profile.
- **Portfolio** — caption, hide and remove. Photos captured from a completed job are
  labelled as such, since the client consented to those appearing.
- **Offers** — the request feed with an inline offer form, plus offers already sent with
  withdraw. An empty feed says *why* (not verified / offline) rather than just being empty.
- **Bookings** — confirmed work. The only place the client's street address appears, and
  only because the booking exists.
- **Earnings** — received, awaiting confirmation, in dispute, and the payment list.

**Staff** (`profiles.is_admin`)
- **Platform** — counts across people, marketplace and subscriptions, each linking to the
  list behind it.
- **Verification** — the queue. Decide against the ID on file (masked to the last four
  digits), categories, base and registration date. A rejection requires a reason, which
  the pro is then shown on their studio page.
- **Reports** and **Disputes** — resolve or dismiss, via the migration-13 RPCs.
- **Providers & users** — searchable, read-only. No contact details or ID numbers.

## Writes go through the database, not the API

Reads are Supabase queries in Server Components, so RLS decides what is visible — a pro's
"bookings" is their own without an `.eq()`. Writes are Server Actions calling the
SECURITY DEFINER RPCs (`save_business_profile`, `set_practitioner_location`, `make_offer`,
`set_practitioner_verification`, `resolve_report`, `resolve_dispute`), each of which
re-checks authorisation itself. `requireStaff()` is a fast failure, never the boundary.

This means the console does not depend on the Nest API being deployed.

## Not built yet

- **Uploading** portfolio photos. It needs the Storage client, a signed upload path and
  image validation, which `apps/mobile/src/lib/upload.ts` already has; a second divergent
  implementation would be worse than pointing people at the one that works.
- Chats/messaging — still only in the consumer app and mobile.
- A Vercel project for this app and its own domain.

## Known gap

The Supabase client here is not parameterised with `<Database>`, so reads are unchecked.
See the note in `src/lib/supabase/client.ts`: supabase-js infers
`.from('practitioner_profiles').select('id')` as `never`, reproducible with that one call
while `profiles` works. Pre-existing and repo-wide — no app types its client. Ruled out:
the PostGIS `unknown` columns (now fixed) and the `PostgrestVersion` value. Row shapes are
named from `@smomo/shared` DTOs at each call site as a partial substitute.
