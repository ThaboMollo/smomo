# Migrations

These were written from a live introspection of project `ltnjiihfgvwtzrmtkclh`
on 2026-10-23. Every claim in the header comments was verified against
production, not inferred from the code.

## First: capture the baseline

The 15 migrations that built the current schema exist only in the remote
history (`supabase_migrations.schema_migrations`) — they were never committed.
Pull them down once so the repo has a real starting point:

```bash
supabase login
supabase link --project-ref ltnjiihfgvwtzrmtkclh
supabase db pull            # writes the baseline and marks it already-applied
supabase migration list     # local vs remote, should show the 15 + these 10
```

Until that is done there is no reviewable record of the RLS policies, triggers
or RPCs that the application depends on.

## Order

Apply in filename order. They are independent transactions, so you can stop
after any one of them.

| # | File | Touches data? | Needs a deploy first? |
|---|------|---------------|----------------------|
| 01 | `lock_down_anon_column_reads` | no (grants only) | yes — ships with the `public.ts` change |
| 02 | `reviews_party_integrity` | no (trigger + policy) | no |
| 03 | `booking_transition_guard` | no (function) | no |
| 04 | `contact_payout_split_expand` | copies PII into new tables | no |
| 05 | `provider_4nf_expand` | copies categories/socials | no |
| 05b | `provider_write_rpcs` | no (functions) | no |
| 06 | `derived_column_integrity` | **yes — backfills first/last name** | no |
| 07 | `reconcile_rating_caches` | **yes — clears 3 fabricated ratings** | no |
| 09 | `complete_booking_rpc` | no (function) | no |
| 11 | `reharden_trigger_function_grants` | no (grants only) | no |
| 10 | `contract_drop_legacy_columns` | **yes — drops columns** | **YES — must be last** |
| 12 | `column_level_write_grants` | no (grants only) | no |
| 13 | `admin_write_rpcs` | no (functions) | yes — admin.ts calls them |
| 14 | `fix_handle_new_user_after_contact_split` | no (trigger function) | no |
| 15 | `rpc_param_defaults` | no (function) | no — but deploy the API after |
| 16 | `optional_coordinates_and_city` | no (adds nullable columns) | no — but deploy all three after |
| 17 | `withhold_request_address_until_booked` | no (one RLS policy) | no — closes a leak, apply first |
| 18 | `practitioner_verification_rpc` | no (new table + function) | no — needed by the console |

Note: 11 sorts before 10 by timestamp, which is intentional — the contract
phase stays last. 14 also sorts before 12 and 13; it is a standalone trigger fix
and does not depend on them.

Filename order is also the correct apply order, so `supabase db push` does the
right thing: 10 is the contract phase and deliberately sorts last.

## Expand / contract

04 and 05 are the expand half: they create the new tables, backfill them, and
keep them in sync from the legacy columns with mirror triggers. Nothing breaks
while both shapes exist. 10 is the contract half: it drops the legacy columns
and the mirror triggers.

So the sequence is:

1. apply 01–09 and 11
2. deploy the API / web / mobile changes in this commit
3. verify the app against production
4. apply 10
5. `pnpm gen:types` to regenerate `packages/shared/src/database.ts`

**The signed-in PII exposure is not fully closed until 10.** 01 closes the
anonymous hole immediately with column grants; the rest of the surface closes
when the columns move.

## What each one fixes

- **01** `profiles.profiles_select_all` and `practitioner_profiles.pp_select_all`
  are both `USING (true)`. An anonymous caller with the publishable key could
  read `phone` for all 41 users and `payshap_proxy` for all 10 practitioners.
- **02** `rv_insert_own` only checked `auth.uid() = reviewer_id`, never that the
  reviewer was party to the booking or that `reviewee_id` was the counterparty.
- **03** `booking_status_guard()` checked who, never from which state, so
  `cancelled -> completed` was allowed.
- **04** Relocates contact PII and payout details into row-securable tables.
- **05 / 05b** The 4NF split: `categories[]` and the four social columns become
  `practitioner_categories` and `practitioner_socials`, with a
  `practitioner_directory` view for reads (which also supplies the `min_price`
  the API was hard-coding to `null`).
- **06** `full_name` vs `first_name`/`last_name` had already diverged on one row;
  `requires_deposit` was derivable from `deposit_percentage` with nothing
  enforcing agreement.
- **07** Three providers carried ratings with zero backing reviews.
- **09** Completing a booking was two non-atomic writes.
- **11** Migrations 02/04/05/06 added five trigger functions without repeating
  the `revoke execute` hardening the original schema applies to its own trigger
  functions, leaving them callable via `/rest/v1/rpc`. Caught by the Supabase
  security advisor after 01–09 were applied.
- **15** `save_business_profile` declared 12 arguments with defaults on only the
  last 5, so `p_bio` and `p_years_experience` were required. PostgREST resolves an
  RPC overload by the exact set of argument names in the body and supabase-js drops
  `undefined` values, so saving a studio profile with no bio sent 5 keys, matched no
  overload, and returned PGRST202 — a 500 to the client. This is spec RC-2, and it was
  live. Required arguments move to the front, every nullable one gets `default null`,
  and the old signature is dropped. The paired half is the `?? null` sweep in
  `apps/api/src/modules/*.ts`; the guard is
  `apps/api/test/contract/rpc-params.spec.ts`.
- **16** Coordinates become optional and the typed city carries matching instead, so
  geolocation can be switched off without inventing a point for every typed address
  (which made "2.1 km away" indefensible). `booking_requests.location` drops NOT NULL;
  `city` is added to `booking_requests` and `practitioner_profiles`; `create_request`,
  `set_practitioner_location` and `search_providers` take nullable coordinates plus
  `p_city`; and both read RPCs return `distance_km` as null when there is no point to
  measure from. It also **removes `address` from `feed_requests_for_practitioner`** — a
  practitioner browsing the open feed now sees the town only, and gets the street address
  from the booking once the client accepts.

  Backwards-compatible with the already-deployed app: every argument name the old API
  sends still exists, with `p_city` defaulted, so nothing fails to resolve. Until the
  deploy lands the feed simply shows a blank address and no distance.
- **17** `br_select_party` allowed `auth.uid() = target_practitioner_id`, so for a
  *directed* request the targeted provider could read the whole row — `address` included —
  off PostgREST with no offer and no booking. `GET /requests/:id` does `select('*')` and
  relies entirely on that policy, so both apps would hand it over; the request also showed
  up in that practitioner's own `/requests/mine`. Verified against production before the
  fix: 1 row, 1 address. The policy is now client-or-admin only.

  Nothing legitimate needed it: directed requests still reach the practitioner through
  `feed_requests_for_practitioner` (SECURITY DEFINER, city only since 16), offers go
  through `make_offer`, and both apps build the offer screen from the feed row they already
  hold. Guarded by `apps/api/test/security/request-address-privacy.spec.ts`, which posts
  its own directed request rather than reading whatever happens to be in the table — the
  vacuous version of that assertion is how this survived.
- **18** `practitioner_profiles.verification_status` was written by nothing: all 16 call
  sites across the API, web and mobile only read it, and migration 12 had revoked
  `authenticated`'s UPDATE on the column. Since column privileges are checked before RLS,
  even an admin could not change it from a client — admitting a pro to the marketplace was
  an untracked service-role edit in the SQL editor. That gate matters: `make_offer` refuses
  an unverified pro and the request feed returns them nothing.

  Adds `set_practitioner_verification()` (admin-checked in the DB, P0001/P0002 per the
  migration-13 convention), an append-only `practitioner_verification_events` log so every
  decision has an author and a reason, and maintenance of the pre-existing but unwritten
  `verified_at`. Also revokes the stray `anon` INSERT/UPDATE grants on
  `verification_status` that migration 12 left behind.

## Rollback

01–03, 05b and 09 are function/policy/grant changes and can be reverted by
re-applying the previous definition (recoverable from `supabase db pull` output
taken before you start). 04–07 add tables and backfill; dropping the new tables
reverts them. **10 is not reversible** — the dropped columns are gone. Take a
backup before applying it. 15 is reversible by re-applying 05b's definition of
`save_business_profile` and dropping the new argument order. 16 is reversible for the
functions the same way; the two `city` columns can be dropped, and re-adding NOT NULL to
`booking_requests.location` requires that no pointless rows have been written yet.
17 is reversible by re-adding the `target_practitioner_id` clause to the policy, which
re-opens the leak — so only deliberately.
