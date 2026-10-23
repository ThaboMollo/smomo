-- 01 — Stop anonymous visitors reading PII and payout details.
--
-- Problem (verified against production on 2026-10-23):
--   profiles.profiles_select_all  is  USING (true)
--   practitioner_profiles.pp_select_all  is  USING (true)
-- so an unauthenticated caller holding the publishable key could read
-- profiles.phone for all 41 users and practitioner_profiles.payshap_proxy
-- for all 10 practitioners.
--
-- RLS cannot restrict individual columns, so this uses Postgres column
-- privileges, which PostgREST honours. Only the `anon` role is narrowed;
-- `authenticated` keeps full access so `GET /v1/me` and the booking-detail
-- counterparty phone keep working. Narrowing the authenticated surface is
-- migration 04 (contact/payout split).
--
-- NOTE: requires the public.ts change that replaces select('*') with an
-- explicit column list on practitioner_profiles. Apply this together with
-- that deploy.

begin;

-- ---------------------------------------------------------------- profiles
revoke select on public.profiles from anon;

-- The public marketplace surface: a display name, an avatar, and the client
-- rating shown on provider pages. No phone, no WhatsApp number, no home
-- address, no legal first/last name, no is_admin flag.
grant select (
  id,
  full_name,
  avatar_url,
  is_practitioner,
  client_rating,
  client_rating_count,
  created_at
) on public.profiles to anon;

-- ------------------------------------------------- practitioner_profiles
revoke select on public.practitioner_profiles from anon;

-- Everything the public provider page, city/category hubs and SEO routes
-- need — deliberately excluding payshap_proxy.
grant select (
  id,
  slug,
  business_name,
  bio,
  categories,
  years_experience,
  service_mode,
  base_address,
  base_lat,
  base_lng,
  travel_radius_km,
  is_online,
  requires_deposit,
  deposit_percentage,
  verification_status,
  verified_at,
  rating,
  rating_count,
  jobs_done,
  instagram,
  facebook,
  tiktok,
  x_handle,
  created_at,
  updated_at
) on public.practitioner_profiles to anon;

-- search_providers() and feed_requests_for_practitioner() are SECURITY
-- DEFINER and read base_location internally, so they are unaffected by the
-- narrowed grant above.

commit;
