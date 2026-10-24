-- 12. Column-level write grants for `authenticated`.
--
-- RLS answers "is this row yours?". Until now nothing answered "may you write THIS
-- COLUMN of it?": `authenticated` held table-wide INSERT/UPDATE/DELETE on every table,
-- and each *_update_own policy is row-scoped with no column constraint. So "my row"
-- meant "every column of my row" — including the columns that encode authority, trust
-- and money.
--
-- Verified before this migration: any signed-up user could
--   * PATCH profiles.is_admin = true, and is_admin() is literally
--     `select is_admin from profiles where id = auth.uid()` — i.e. full admin;
--   * self-verify (practitioner_profiles.verification_status = 'verified');
--   * fabricate rating / rating_count / jobs_done, the trust signals clients choose on;
--   * self-grant subscriptions.status = 'active' (the paywall);
--   * write payments.status / amount_zar, and rewrite bookings.final_price_zar.
--
-- Fix: revoke the table-wide privileges and grant back only the columns a user
-- legitimately edits. Everything else already has, or now gets, a SECURITY DEFINER RPC
-- (those run as the function owner and are unaffected by these grants) — completing the
-- pattern migration 05b started. Migration 01 hardened anon READS; this is the matching
-- lockdown for authenticated WRITES.
--
-- Column lists below were derived by inventorying every `.from(<table>).insert/update/
-- upsert/delete` in apps/api/src, plus apps/web and apps/mobile (which write only to
-- `messages` and `device_push_tokens`, neither touched here). Re-run that inventory
-- before changing this file: a missing grant fails as `42501 permission denied for
-- column`, and a stray one silently reopens the hole.

begin;

-- ============================================================= profiles
-- Writers: me.ts:94 (first_name, last_name, full_name, avatar_url via zUpdateProfile)
--          practitioner.ts:114 (is_practitioner on finalize)
-- Rows are created by the SECURITY DEFINER trigger auth.users -> handle_new_user(),
-- so signup needs no INSERT here; the grant covers progressive-signup paths only.
-- full_name stays writable on purpose: profiles_derive_full_name() overwrites it from
-- first/last when either is set, but keeps a supplied value when neither is — which is
-- how progressive signup names an account before the name fields exist.
revoke insert, update, delete on public.profiles from authenticated;
grant  insert (id, first_name, last_name, full_name, avatar_url)
    on public.profiles to authenticated;
grant  update (first_name, last_name, full_name, avatar_url, is_practitioner)
    on public.profiles to authenticated;
-- withheld: is_admin, client_rating, client_rating_count, created_at, updated_at, id(update)

-- ================================================= practitioner_profiles
-- Writers: practitioner.ts:101 (is_online), practitioner.ts:116 (row creation on finalize).
-- Everything else belongs to save_business_profile() / set_practitioner_location(),
-- both SECURITY DEFINER. slug is derived by set_practitioner_slug() and appears in public
-- URLs, so it must not be settable by hand.
revoke insert, update, delete on public.practitioner_profiles from authenticated;
grant  insert (id)        on public.practitioner_profiles to authenticated;
grant  update (is_online) on public.practitioner_profiles to authenticated;
-- withheld: verification_status, verified_at, rating, rating_count, jobs_done, slug,
--           business_name, bio, years_experience, service_mode, travel_radius_km,
--           requires_deposit, deposit_percentage, base_location, base_lat, base_lng,
--           base_address, created_at, updated_at

-- ============================================================= bookings
-- Writers: bookings.ts:103 (status -> in_progress), bookings.ts:138 (status -> cancelled,
-- cancel_reason). Rows are created by accept_offer(); money and party columns are set at
-- creation and by complete_booking(). bookings_status_guard() still polices which status
-- transitions are legal — this stops the columns it does NOT cover being rewritten.
revoke insert, update, delete on public.bookings from authenticated;
grant  update (status, cancel_reason) on public.bookings to authenticated;
-- withheld: final_price_zar, deposit_amount_zar, client_id, practitioner_id, offer_id,
--           request_id, category, lat, lng, location, scheduled_at, completed_at,
--           in_progress_at, cancelled_at, cancelled_by, created_at

-- ============================================================= payments
-- No direct writes remain: mark_payment_paid() and verify_payment() already own the
-- member paths, and admin dispute resolution moves to resolve_dispute() in migration 13.
-- There is no trigger on payments, so these grants were the only thing standing between
-- a payer and marking their own payment verified.
revoke insert, update, delete on public.payments from authenticated;

-- ======================================================== subscriptions
-- Writer: practitioner.ts:131 creates the 30-day trial on finalize. That upsert uses
-- ignoreDuplicates (ON CONFLICT DO NOTHING), so INSERT alone is enough and UPDATE can go
-- entirely — status/plan/current_period_end belong to billing (service role).
revoke insert, update, delete on public.subscriptions from authenticated;
grant  insert (practitioner_id, plan, status, trial_ends_at)
    on public.subscriptions to authenticated;
-- withheld (update): status, plan, current_period_end, trial_ends_at

-- ============================================================== reports
-- Writer: reports.ts:17 (users file reports). Resolution is an admin action and moves to
-- resolve_report() in migration 13.
revoke insert, update, delete on public.reports from authenticated;
grant  insert (reporter_id, reported_user_id, booking_id, reason, details)
    on public.reports to authenticated;
-- withheld: status, resolved_by, resolution

commit;
