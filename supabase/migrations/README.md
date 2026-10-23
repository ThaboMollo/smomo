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
| 10 | `contract_drop_legacy_columns` | **yes — drops columns** | **YES — must be last** |

Filename order is also the correct apply order, so `supabase db push` does the
right thing: 10 is the contract phase and deliberately sorts last.

## Expand / contract

04 and 05 are the expand half: they create the new tables, backfill them, and
keep them in sync from the legacy columns with mirror triggers. Nothing breaks
while both shapes exist. 10 is the contract half: it drops the legacy columns
and the mirror triggers.

So the sequence is:

1. apply 01–09
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

## Rollback

01–03, 05b and 09 are function/policy/grant changes and can be reverted by
re-applying the previous definition (recoverable from `supabase db pull` output
taken before you start). 04–07 add tables and backfill; dropping the new tables
reverts them. **10 is not reversible** — the dropped columns are gone. Take a
backup before applying it.
