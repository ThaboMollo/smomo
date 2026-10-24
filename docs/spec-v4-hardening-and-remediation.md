# Smomo v4 — Security Hardening & Regression Remediation (Implementation Spec)

## Context

An end-to-end regression sweep (2026-10-24) of `apps/web` + `apps/api` against the live
Supabase project found 11 defects, including a **critical privilege escalation** that lets any
signed-up user grant themselves admin. This spec fixes the **causes**, not the symptoms.

Scope: `apps/api`, `apps/web`, `packages/shared`, `supabase/migrations`.
Out of scope: `apps/mobile` (inherits the API and shared-package fixes for free).

Baseline that is already healthy and must stay healthy: `tsc --noEmit` clean, production build
clean (99 prerendered pages), all 109 public routes 200, RLS correctly blocks cross-tenant
reads/updates/deletes, 401 on missing/forged tokens, 20+ malformed payloads correctly rejected.

---

## ROOT CAUSE ANALYSIS

Eleven findings collapse into **seven** causes. Fix the cause once and the findings go with it.

### RC-1 — Write authorization stops at the row

RLS answers *"is this row yours?"*. Nothing answers *"may you write **this column**?"*.
`authenticated` holds blanket `INSERT/UPDATE/DELETE` on all 20 public tables, and every
`*_update_own` policy is row-scoped with no column constraint. So "my row" means "every column
of my row", including the columns that encode authority, trust and money.

Verified consequences: `profiles.is_admin` self-grant (→ full admin, because `is_admin()` is
literally `select is_admin from profiles where id = auth.uid()`), `verification_status`
self-verify, `rating`/`rating_count`/`jobs_done` fabrication, `subscriptions.status` self-grant,
`payments.status`/`amount_zar` writes, `bookings.final_price_zar` rewrite.

Note what is *not* broken: RLS is enabled on all 18 tables, `practitioner_directory` is
`security_invoker=on`, DELETE policies exist only where intended. The architecture is sound.
The single missing layer is column grants. Migration 01 hardened anon **reads**; authenticated
**writes** were never covered.

> Fixes findings 1 (critical) and the payment/booking/subscription integrity gaps.

### RC-2 — Optional TS fields become absent JSON keys; the SQL params they map to are required

`p_bio: input.bio` / `p_years_experience: input.yearsExperience ?? undefined`. When a zod-optional
field is absent, supabase-js **omits the key**, and PostgREST resolves RPC overloads by the exact
set of named arguments. `save_business_profile` declares 7 params with no DB default, so the
overload fails to resolve and the call 500s.

Proven: all 7 params with explicit nulls → `204`; the two omitted → `404 PGRST202`.
3 of 4 field combinations fail. Both fields are optional in the schema, so the normal path is the
broken one.

> Fixes finding 3 (studio profile save).

### RC-3 — Postgres is the only validator, and its errors are not translated

Two halves of one cause — the boundary between SQL and HTTP is unmanaged.

(a) **Business rules raise as Postgres exceptions and surface as HTTP 500.** `make_offer` raising
`'practitioner not verified'` reaches the client as a 500, so callers can't distinguish a rule
from a fault, and real faults are buried in monitoring noise.

(b) **Some rules exist in neither zod nor a CHECK.** `zSetLocation` is bare `z.number()`, so
`lat=999, lng=999` validated, passed through `set_practitioner_location`, and **persisted**.

> Fixes findings 6 and 7.

### RC-4 — A write that matches zero rows is treated as a successful write

PostgREST returns no error for a 0-row `UPDATE`/`DELETE`, and the controllers return
`{ ok: true }` unconditionally. So "RLS blocked you", "that row doesn't exist" and "done" are
indistinguishable. `POST /requests/:id/cancel` returns `201 {ok:true}` for non-existent, foreign,
and already-cancelled requests alike; cross-tenant service update/delete likewise.

Data is safe — RLS holds — but the UI can confirm work that never happened.

> Fixes finding 8.

### RC-5 — "Which providers are listable" is defined three times, and they disagree

`search_providers` (in-app), the `/v1/public/*` queries (SEO pages) and `make_offer`'s gate each
encode eligibility separately. The public pages require `verified`; `search_providers` does not,
so an unverified provider is discoverable in-app but not publicly — and `make_offer` then refuses
their offer, which is a dead end for the client who found them.

The same `WHERE` clause also conflates two different radii: the caller's `p_max_km` is applied
**only** to the studio branch, so for mobile and the default no-mode search the user's radius
control does nothing (`maxKm=1` returns providers 7.47 km away). 4 of 5 providers are
mobile/both, so the filter is effectively dead.

> Fixes findings 4 and 5.

### RC-6 — The core conversion flow hard-depends on an unowned third party

`/app/request/new` does `if (!place) throw 'Choose where this is happening'`, and `place.lat/lng`
can only come from `photon.komoot.io` — keyless, free, public, `cache: 'no-store'`, no fallback
provider, and an app-side limit of 90/min that is far above what that host tolerates. A 25-request
burst got this IP connection-refused for an extended period; both autocomplete and reverse
geocode then 502 and posting a request becomes impossible.

**Direction change (decided 2026-10-24):** rather than hardening the geocoder, geolocation is
**parked behind an environment switch**. See Phase 2.

> Fixes finding 2.

### RC-7 — Nothing executes the app before it ships

There is no test file anywhere in the repo, lint is not gating (30 errors, incl. `middleware.ts`),
and `sitemap.ts` is a static function that never queries the DB, so no `/pro/[slug]` page — the
actual SEO money pages — is ever listed.

Every finding above is cheap to detect and was shipped because nothing ran. This is the cause
that keeps the other six from recurring.

> Fixes findings 9, 10, 11 — and prevents 1–8 from coming back.

---

## PHASE 1 — Column-level write authorization `CRITICAL — ship first`

**Principle:** `authenticated` may write only the columns a user legitimately edits. Everything
else moves behind `SECURITY DEFINER` RPCs (which bypass grants by design, so existing RPCs keep
working untouched). This completes the pattern migration 05b already started but never enforced.

### 1.1 Migration `20261024090000_12_column_level_write_grants.sql`

```sql
begin;

-- ========== profiles: only the person's own display fields
revoke insert, update on public.profiles from authenticated;
grant  insert (id, first_name, last_name, avatar_url)           on public.profiles to authenticated;
grant  update (first_name, last_name, avatar_url, is_practitioner) on public.profiles to authenticated;
-- withheld: is_admin, client_rating, client_rating_count, full_name (trigger-derived),
--           id, created_at, updated_at

-- ========== practitioner_profiles: everything real goes through RPCs
revoke insert, update on public.practitioner_profiles from authenticated;
grant  insert (id)        on public.practitioner_profiles to authenticated;
grant  update (is_online) on public.practitioner_profiles to authenticated;
-- withheld: verification_status, verified_at, rating, rating_count, jobs_done, slug,
--           and every column save_business_profile() / set_practitioner_location() own

-- ========== bookings: parties move status, nothing else
revoke insert, update on public.bookings from authenticated;
grant  update (status, cancel_reason) on public.bookings to authenticated;
-- withheld: final_price_zar, deposit_amount_zar, client_id, practitioner_id, offer_id,
--           request_id, category, lat, lng, location, scheduled_at, completed_at, in_progress_at
-- INSERT is accept_offer()'s job only.

-- ========== payments & subscriptions: no direct writes at all
revoke insert, update on public.payments from authenticated;
revoke update          on public.subscriptions from authenticated;
grant  insert (practitioner_id, plan, status, trial_ends_at) on public.subscriptions to authenticated;
-- subscriptions UPDATE belongs to billing (service role). The finalize upsert uses
-- ignoreDuplicates (ON CONFLICT DO NOTHING), so INSERT alone is sufficient.

-- ========== reports: users file, admins resolve via RPC
revoke update on public.reports from authenticated;

commit;
```

### 1.2 Migration `20261024090100_13_admin_write_rpcs.sql`

Phase 1.1 revokes the columns `admin.ts` writes directly, so those two paths move into definer
RPCs that re-check `is_admin()` **in the database** (the app-level `ensureAdmin` becomes a fast
pre-check, not the boundary).

```sql
create or replace function public.resolve_report(
  p_report_id uuid, p_status public.report_status, p_resolution text default null
) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'P0001';
  end if;
  update public.reports
     set status = p_status, resolution = p_resolution, resolved_by = auth.uid()
   where id = p_report_id;
  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
end $$;

create or replace function public.resolve_dispute(
  p_payment_id uuid, p_resolve_as public.payment_status
) returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'P0001';
  end if;
  update public.payments
     set status = p_resolve_as, verified_at = now(), verified_by = auth.uid()
   where id = p_payment_id;
  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
end $$;

revoke all on function public.resolve_report(uuid, public.report_status, text) from public, anon;
grant execute on function public.resolve_report(uuid, public.report_status, text) to authenticated;
revoke all on function public.resolve_dispute(uuid, public.payment_status) from public, anon;
grant execute on function public.resolve_dispute(uuid, public.payment_status) to authenticated;
```

### 1.3 API changes

| File | Change |
|---|---|
| `apps/api/src/modules/admin.ts:45` | `.from('reports').update(...)` → `db.rpc('resolve_report', {...})` |
| `apps/api/src/modules/admin.ts:76` | `.from('payments').update(...)` → `db.rpc('resolve_dispute', {...})` |
| `apps/api/src/modules/practitioner.ts:116` | `.upsert({ id })` emits `ON CONFLICT DO UPDATE SET id=…`, which now needs `UPDATE(id)`. Change to `.insert({ id }).select()` and swallow `23505`, or add `ignoreDuplicates: true`. |

### 1.4 Guard test (the part that makes it stay fixed)

`apps/api/test/security/column-grants.spec.ts` — enumerate every withheld column and assert a
direct PostgREST `PATCH` as an ordinary user does **not** change it:

```
profiles:              is_admin, client_rating, client_rating_count
practitioner_profiles: verification_status, verified_at, rating, rating_count, jobs_done, slug
bookings:              final_price_zar, deposit_amount_zar
payments:              status, amount_zar, verified_at, verified_by
subscriptions:         status, plan, current_period_end
```

Assert on the **re-read value**, never on the HTTP status — a blocked column write returns `200`
with zero rows affected (see RC-4).

---

## PHASE 2 — Address capture behind a geolocation switch

**Decision:** geolocation is parked. One environment variable turns the whole geo stack on or off.
When off, nothing in the app contacts a geocoder or prompts for GPS, and the user types a full
structured address instead.

### 2.1 The flag

`packages/shared` or `apps/web/src/lib/flags.ts`, following the existing `SHOW_PUBLIC_RATINGS`
convention exactly:

```ts
/**
 * Geolocation (address autocomplete, reverse geocoding and browser GPS) is off by default:
 * the only provider is a keyless public Photon instance that cannot be relied on for the
 * request flow. With it off, users type a full structured address and coordinates are derived
 * from the built-in city/subdivision catalogue — no network call.
 * Set NEXT_PUBLIC_GEOLOCATION_ENABLED=true to switch the geocoder back on.
 */
export const GEOLOCATION_ENABLED = process.env.NEXT_PUBLIC_GEOLOCATION_ENABLED === 'true';
```

Default **off**. Add to `.env.example` and to the Vercel project for every environment.

### 2.2 Behaviour matrix

| Surface | `true` (today's behaviour) | `false` (new default) |
|---|---|---|
| `/app/request/new` | `AddressField` autocomplete | `ManualAddressFields` (full postal) |
| `/app/studio`, `/app/studio/profile` | `AddressField` | `ManualAddressFields` (full postal) |
| `/app/profile` | `AddressField` | `ManualAddressFields` (full postal) |
| `/(auth)/register` | `AddressField` | `ManualAddressFields` (full postal) |
| `/app/discover` | `AddressField` + GPS | `AreaPicker` — **country + province + city only** |
| "Use my location" / `use-coords` | enabled | button hidden, `navigator.geolocation` never called |
| `/api/places/*` | live | return `404 { error: 'disabled' }` before any upstream fetch |

`/app/discover` deliberately differs: it needs a *search centre*, not a postal address. Nobody
types "Address line 2" to browse.

### 2.3 Catalogue: add subdivisions to `packages/shared/src/countries.ts`

The catalogue has 40 cities with lat/lng across 6 countries but **no provinces**. Add:

```ts
export type Subdivision = {
  slug: string;
  name: string;
  /** Centroid, used when the typed city is not in `cities`. */
  lat: number;
  lng: number;
};

export type Country = {
  // …existing fields…
  /** What this country calls its first-level subdivision, for the field label. */
  subdivisionLabel: 'Province' | 'Region' | 'District';
  subdivisions: Subdivision[];
};
```

Per country (label → count): **ZA** Province → 9 · **ZW** Province → 10 · **LS** District → 10 ·
**BW** District → 10 · **SZ** Region → 4 · **NA** Region → 14.

### 2.4 `ManualAddressFields` component

Fields, in order, exactly as specified:

1. **Country** — select, 6 options, default `ZA`
2. **Address line 1** — text, required
3. **Address line 2** — text, optional
4. **Suburb** — text, required
5. **City** — combobox seeded from `COUNTRIES[c].cities`, free text allowed
6. **{subdivisionLabel}** — select from `COUNTRIES[c].subdivisions`, required, label and options
   both driven by the selected country; resets when country changes

### 2.5 Coordinate resolution — offline cascade

The API contract is unchanged: `zCreateRequest` still requires `lat`/`lng`, and all geo matching
(`search_providers`, `feed_requests_for_practitioner`, `travel_radius_km`) keeps working. With the
flag off, coordinates are derived locally, with **no network call**:

```
exact city match in COUNTRIES[c].cities (slug or case-insensitive name)
  → that city's lat/lng
else selected subdivision
  → subdivision centroid
else
  → COUNTRIES[c].center
```

This resolves to city-level precision, which is the granularity the matching actually uses.

### 2.6 Composed address + preserved structure

`address` (existing `text` column, unchanged) receives the composed display string:

```
line1, [line2, ] suburb, city, {subdivision}, {country}
```

Add a small migration so the structure is not lost for later:

```sql
alter table public.booking_requests    add column if not exists address_parts jsonb;
alter table public.practitioner_profiles add column if not exists address_parts jsonb;
```

Extend `zCreateRequest` and `zSetLocation` with an optional `addressParts` object
(`{country, line1, line2?, suburb, city, subdivision}`), and widen `set_practitioner_location` /
`create_request` with a `p_address_parts jsonb default null` param — **with a default**, per RC-2.

### 2.7 Kill the dead dependency path

While the flag is off, `/api/places/{autocomplete,details,reverse}` must short-circuit **before**
`getPlacesProvider()`, so a disabled deployment can never be the source of upstream traffic. Keep
the route files — they are the on-switch.

---

## PHASE 3 — RPC parameter contract

**Rule:** a nullable RPC argument gets a DB default **and** an explicit `null` from the API.
Belt and braces, because either alone is a silent trap.

### 3.1 Migration `20261024090200_14_rpc_param_defaults.sql`

```sql
create or replace function public.save_business_profile(
  p_business_name      text,
  p_categories         public.service_category[],
  p_service_mode       public.service_mode,
  p_travel_radius_km   numeric,
  p_requires_deposit   boolean,
  p_bio                text    default null,
  p_years_experience   integer default null,
  p_deposit_percentage integer default null,
  p_instagram          text    default null,
  p_facebook           text    default null,
  p_tiktok             text    default null,
  p_x_handle           text    default null
) returns void language plpgsql security definer set search_path to 'public' as $$
  -- body unchanged from migration 05b
$$;

drop function if exists public.save_business_profile(
  text, text, public.service_category[], integer, public.service_mode,
  numeric, boolean, integer, text, text, text, text);
```

Required params move to the front, every nullable one gets `default null`. Drop the old
12-arg signature so no stale overload can be resolved.

### 3.2 API

`apps/api/src/modules/practitioner.ts:44` — replace every `?? undefined` with `?? null` in RPC
argument objects. Sweep all 14 `.rpc()` call sites; `p_message` in `offers.ts` has the same shape.

### 3.3 Guard

`apps/api/test/contract/rpc-params.spec.ts` — for each RPC, call it with the **minimal** payload
(every optional field absent) and assert the response is not `PGRST202`. This is exactly the
failure that shipped.

---

## PHASE 4 — Honest errors, honest success

### 4.1 Postgres → HTTP exception filter

`apps/api/src/common/postgrest-exception.filter.ts`, registered globally:

| Source | → HTTP |
|---|---|
| `P0001` (raise_exception — business rule) | `422` + the raised message |
| `P0002` (our "not found" convention) | `404` |
| `42501` insufficient_privilege / RLS denial | `403` |
| `23505` unique_violation | `409` |
| `23503` foreign_key_violation | `400` |
| `23514` check_violation | `400` |
| `PGRST202` (no matching function) | `500` — a genuine bug; log loudly, never swallow |
| anything else | `500`, message not echoed to the client |

Then `throw error` stays idiomatic in the controllers and stops lying. Existing RPCs that
`raise exception '...'` already emit `P0001`, so `'practitioner not verified'` becomes a `422`
with no SQL change.

### 4.2 Affected-row assertions

`apps/api/src/common/db.ts`:

```ts
/** Runs a mutation and throws NotFound when RLS or a bad id matched zero rows. */
export async function mutateOne<T>(
  q: PostgrestFilterBuilder<T>,
  notFound = 'Not found',
): Promise<void> {
  const { data, error } = await q.select('id');
  if (error) throw error;
  if (!data?.length) throw new NotFoundException(notFound);
}
```

Apply to every bare `.update()` / `.delete()`: `requests.ts:85` (cancel), `practitioner.ts:165`
(service update), `practitioner.ts:173` (service delete), `practitioner.ts:209` (portfolio
delete), `bookings.ts:103`, `bookings.ts:138`, `me.ts:94`.

While in `practitioner.ts`, add the missing ownership filters — `.eq('practitioner_id', user.id)`
on service update/delete and portfolio delete. RLS already blocks these, but the API should not
be relying on RLS alone to scope a query it could scope itself.

### 4.3 Coordinate validation

`packages/shared/src/contracts.ts`:

```ts
const zLat = z.number().min(-90).max(90);
const zLng = z.number().min(-180).max(180);
```

Use in `zSetLocation`, `zCreateRequest`, `zSearchProvidersQuery`. Plus the DB backstop:

```sql
alter table public.practitioner_profiles
  add constraint practitioner_profiles_latlng_valid check (
    (base_lat is null and base_lng is null) or
    (base_lat between -90 and 90 and base_lng between -180 and 180)
  );
```

**Pre-flight:** `select id from practitioner_profiles where base_lat not between -90 and 90
or base_lng not between -180 and 180;` must be empty before the constraint is added.

---

## PHASE 5 — One definition of a listable provider

### 5.1 Migration `20261024090300_15_search_providers_eligibility.sql`

Replace the `WHERE` clause of `search_providers` (migration 05 line ~246). Two corrections:

```sql
  where pp.is_online
    and pp.verification_status = 'verified'          -- (a) match the public pages
    and pp.base_location is not null
    and (p_category is null or exists (
          select 1 from public.practitioner_categories pc
           where pc.practitioner_id = pp.id and pc.category = p_category))
    -- (b) the caller's radius is an upper bound on EVERY result
    and st_distance(pp.base_location, me.g) / 1000 <= p_max_km
    and (
      -- mobile: they must also be willing to travel to the caller
      ( (p_mode = 'mobile' or p_mode is null) and pp.service_mode in ('mobile','both')
        and st_distance(pp.base_location, me.g) / 1000 <= pp.travel_radius_km )
      or
      -- studio: the caller travels, so p_max_km above is the only distance rule
      ( (p_mode = 'studio' or p_mode is null) and pp.service_mode in ('studio','both') )
    )
  order by distance_km asc;
```

`p_max_km` now caps every branch; `travel_radius_km` becomes an *additional* mobile constraint
rather than a replacement for the user's choice.

### 5.2 Shared eligibility predicate

Extract `public.provider_is_listable(pp public.practitioner_profiles) returns boolean` as
`is_online and verification_status = 'verified' and base_location is not null`, and call it from
`search_providers` **and** the `/v1/public/*` queries in `apps/api/src/modules/public.ts`, so the
two surfaces cannot drift again.

### 5.3 Tests

- `maxKm` is monotonic: results at `maxKm=k` ⊆ results at `maxKm=k+n`, and no result exceeds
  `maxKm` — the exact assertion that would have caught the 7.47 km hit at `maxKm=1`.
- An unverified online provider appears in **neither** `/providers/search` nor `/v1/public/*`.

---

## PHASE 6 — Regression suite + CI gate `prevents recurrence`

The sweep was driven by a throwaway Python harness. Commit it as a real suite — this is the
highest-leverage item in the spec.

### 6.1 Suite

`apps/api/test/` with Vitest, run against a Supabase **branch** (never production):

```
test/
  helpers/auth.ts         login as a role, call the API, call PostgREST directly
  security/
    column-grants.spec.ts  Phase 1.4 — every withheld column
    cross-tenant.spec.ts   read/update/delete another user's rows
    auth-boundary.spec.ts  missing / malformed / forged tokens, admin gates
  contract/
    rpc-params.spec.ts     Phase 3.3 — minimal payload per RPC
    validation.spec.ts     the 20+ malformed payloads that already pass
  flows/
    request-lifecycle.spec.ts  create → offer → accept → booking → complete → review
    practitioner.spec.ts       profile / services / portfolio / online / location
  search/
    eligibility.spec.ts    Phase 5.3
```

**Seed a verified practitioner with an active subscription.** The whole offer→booking→payment→
review half of the lifecycle was untestable in the sweep because both diag accounts are unverified
and `make_offer` correctly refuses them — and self-verifying to get past it is the vulnerability
in Phase 1. Make it a fixture, not a manual DB edit.

### 6.2 Web smoke test

Playwright, chromium only, one spec: every public route 200, one authenticated route per role
group renders past the loading shell, and `/app/*` redirects to `/login` when signed out. The
sweep was HTTP/SSR-level only — no CSS, layout or client-side interactivity was ever exercised.

### 6.3 CI

`.github/workflows/ci.yml`: `typecheck → lint → build → test:api → test:web`, blocking on PRs to
`main`. Lint must be blocking, which means Phase 7.1 lands first.

---

## PHASE 7 — Housekeeping

### 7.1 Lint to zero (30 errors, 18 files)

Two real categories, not just noise:

- `react-hooks/set-state-in-effect` (×5) — `ThemeToggle.tsx:17`, `use-coords.ts:22`,
  `PwaProvider.tsx:43`, `login/page.tsx:20`, `register/page.tsx:61`, `profile/page.tsx:40`,
  `report/page.tsx:24`, `request/new/page.tsx:47`. These are genuine cascading-render smells;
  derive during render or use `useSyncExternalStore` (`ThemeToggle` and `use-coords` are both
  external-store shaped).
- `@typescript-eslint/no-explicit-any` — including `middleware.ts:15` and
  `lib/supabase/server.ts:14`. Type the `cookiesToSet` parameter from `@supabase/ssr`.

Note `use-coords.ts` is also touched by Phase 2 — do Phase 2 first and fix it once.

### 7.2 Provider pages in the sitemap

`apps/web/src/app/sitemap.ts` is sync and never queries the DB, so no `/pro/[slug]` is listed —
the provider profiles are the pages the SEO strategy exists for. Make it `async`, fetch the
listable providers via the Phase 5.2 predicate, and append `/pro/${slug}`. Keep the existing
revalidate window.

### 7.3 Places same-origin guard

`sameOrigin()` returns `true` when `Origin` is absent, so the abuse brake is bypassed by omitting
one header. Low severity (cost control, not a security boundary) and moot while Phase 2 keeps the
routes disabled — tighten when geolocation is switched back on: require `sec-fetch-site:
same-origin` for browser requests and treat a missing `Origin` as cross-origin for these routes.

---

## BUILD SEQUENCE

| # | Phase | Why here |
|---|---|---|
| 1 | **1.1–1.3** column grants + admin RPCs | Live privilege escalation. Ship today. |
| 2 | **1.4** grant guard test | Prove 1 landed and can't regress. |
| 3 | **3** RPC param contract | Studio profile save is fully broken. Small, isolated. |
| 4 | **4** error filter + affected rows + coords | Makes 1 and 3 observable instead of silent. |
| 5 | **2** geolocation switch | Largest surface (6 components, catalogue, migration). |
| 6 | **5** eligibility predicate | Depends on nothing above; do once 2 settles. |
| 7 | **6** suite + CI | Lock everything in. |
| 8 | **7** housekeeping | Lint must be clean before CI can block on it. |

Phases 1, 3 and 4 are independently shippable and should not wait for 2.

---

## VERIFICATION

Re-run the original sweep and require:

1. `PATCH /rest/v1/profiles {is_admin:true}` leaves `is_admin = false` — likewise
   `verification_status`, `rating`, `rating_count`, `jobs_done`, `subscriptions.status`,
   `payments.status`, `bookings.final_price_zar`.
2. `PUT /practitioner/profile` returns `200` for all 4 bio × yearsExperience combinations.
3. `GET /providers/search?maxKm=1` returns no provider with `distance_km > 1`.
4. An unverified online provider appears in neither in-app search nor the public pages.
5. `POST /offers` as an unverified practitioner returns **422**, not 500.
6. `set_practitioner_location` with `lat=999` returns **400** and persists nothing.
7. Cancel of a non-existent / foreign / already-cancelled request returns **404**, not `{ok:true}`.
8. With `NEXT_PUBLIC_GEOLOCATION_ENABLED` unset: no `/api/places/*` request is made anywhere in
   the app, no GPS prompt appears, and a request can be posted end-to-end by typing an address.
9. With it `=true`: today's autocomplete behaviour returns unchanged.
10. `pnpm lint` exits 0; `sitemap.xml` contains one entry per listable provider.

**Clean up afterwards:** the sweep left test rows on the `smomo.diag.*` accounts —
`booking_requests` `30427a16…`, `78f4de2d…` (both cancelled), `services` `8abe42a6…`,
`portfolio_items` `043d45a0…`, and one `reports` row. All mutated pre-existing data was already
restored.

---

## RISKS / NOTES

- **Phase 1 can break writes it didn't intend to.** Grants are revoked wholesale then
  re-granted per column; any write path not inventoried here fails closed. The inventory came
  from grepping every `.from(...).insert/update/delete` in `apps/api/src` — re-run that grep
  before applying, and check `apps/mobile` for direct Supabase writes that bypass the API.
- **Apply Phase 1 to a Supabase branch first.** A missed column grant is a production outage,
  and the failure mode is a silent 0-row write, not an error.
- `is_practitioner` stays self-writable (needed by `finalize`). It gates nothing on its own —
  studio access is really gated by the `practitioner_profiles` row plus verification plus
  subscription. Move it into a `finalize_practitioner()` RPC if that assumption ever changes.
- **City-level coordinates are a real precision loss** for mobile providers, whose
  `travel_radius_km` matching now resolves against a city centroid rather than a street address.
  Acceptable at current provider density (5 providers, 2 cities); revisit before launch, and note
  this is the strongest argument for turning the geocoder back on with a funded provider.
- `photon.komoot.io` may still be refusing this IP. That has no bearing on Phase 2 with the flag
  off, but will affect testing Phase 2 with it `=true`.
- The 4NF migrations (01–11) **are** applied to the live project — `save_business_profile` exists
  and runs correctly when called with all its parameters. No migration backfill is needed.
