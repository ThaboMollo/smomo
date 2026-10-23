-- 05b — Write paths for the normalised tables.
--
-- Saving a business profile now touches four tables (profiles,
-- practitioner_profiles, practitioner_categories, practitioner_socials). The
-- old endpoint did that as three separate PostgREST calls from the API, which
-- is not atomic — a failure halfway left the provider with new categories and
-- an old profile. These RPCs make each write one transaction, matching how
-- create_request / make_offer / accept_offer already work.
--
-- None of them reference the legacy columns, so they behave identically before
-- and after migration 10.

begin;

-- ======================================================= save_business_profile
create or replace function public.save_business_profile(
  p_business_name      text,
  p_bio                text,
  p_categories         public.service_category[],
  p_years_experience   integer,
  p_service_mode       public.service_mode,
  p_travel_radius_km   numeric,
  p_requires_deposit   boolean,
  p_deposit_percentage integer default null,
  p_instagram          text default null,
  p_facebook           text default null,
  p_tiktok             text default null,
  p_x_handle           text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller       uuid := auth.uid();
  wants_dep    boolean;
  dep_pct      integer;
begin
  if caller is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(array_length(p_categories, 1), 0) = 0 then
    raise exception 'at least one category is required';
  end if;

  -- requires_deposit is derivable from the percentage; keep them coherent so
  -- the practitioner_profiles_deposit_coherent CHECK always holds.
  dep_pct   := nullif(coalesce(p_deposit_percentage, 0), 0);
  wants_dep := coalesce(p_requires_deposit, false) and dep_pct is not null;
  if not wants_dep then dep_pct := null; end if;

  insert into public.practitioner_profiles (
    id, business_name, bio, years_experience, service_mode,
    travel_radius_km, requires_deposit, deposit_percentage
  ) values (
    caller, p_business_name, p_bio, p_years_experience, p_service_mode,
    p_travel_radius_km, wants_dep, dep_pct
  )
  on conflict (id) do update set
    business_name      = excluded.business_name,
    bio                = excluded.bio,
    years_experience   = excluded.years_experience,
    service_mode       = excluded.service_mode,
    travel_radius_km   = excluded.travel_radius_km,
    requires_deposit   = excluded.requires_deposit,
    deposit_percentage = excluded.deposit_percentage;

  update public.profiles set is_practitioner = true where id = caller;

  -- categories: replace the set
  delete from public.practitioner_categories
   where practitioner_id = caller
     and not (category = any (p_categories));

  insert into public.practitioner_categories (practitioner_id, category)
  select caller, c from unnest(p_categories) as c
  on conflict do nothing;

  -- socials: clear the blanked platforms, then upsert the supplied ones.
  -- Two plain statements: no temp table (this is SECURITY DEFINER, and an
  -- implicitly-searched pg_temp is best avoided here) and no data-modifying CTE.
  delete from public.practitioner_socials ps
   where ps.practitioner_id = caller
     and (
          (ps.platform = 'instagram' and coalesce(btrim(p_instagram), '') = '')
       or (ps.platform = 'facebook'  and coalesce(btrim(p_facebook),  '') = '')
       or (ps.platform = 'tiktok'    and coalesce(btrim(p_tiktok),    '') = '')
       or (ps.platform = 'x'         and coalesce(btrim(p_x_handle),  '') = '')
     );

  insert into public.practitioner_socials (practitioner_id, platform, handle)
  select caller, v.platform, btrim(v.handle)
    from (values
      ('instagram'::public.social_platform, p_instagram),
      ('facebook'::public.social_platform,  p_facebook),
      ('tiktok'::public.social_platform,    p_tiktok),
      ('x'::public.social_platform,         p_x_handle)
    ) as v(platform, handle)
   where coalesce(btrim(v.handle), '') <> ''
  on conflict (practitioner_id, platform) do update set handle = excluded.handle;
end;
$$;

revoke all on function public.save_business_profile(
  text, text, public.service_category[], integer, public.service_mode,
  numeric, boolean, integer, text, text, text, text) from public, anon;
grant execute on function public.save_business_profile(
  text, text, public.service_category[], integer, public.service_mode,
  numeric, boolean, integer, text, text, text, text) to authenticated;

-- ========================================================= set_profile_contact
create or replace function public.set_profile_contact(
  p_phone           text default null,
  p_whatsapp_number text default null,
  p_home_address    text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'not authenticated'; end if;

  insert into public.profile_contact (user_id, phone, whatsapp_number, home_address)
  values (
    caller,
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_whatsapp_number, '')), ''),
    nullif(btrim(coalesce(p_home_address, '')), '')
  )
  on conflict (user_id) do update set
    phone           = coalesce(excluded.phone,           public.profile_contact.phone),
    whatsapp_number = excluded.whatsapp_number,
    home_address    = excluded.home_address,
    updated_at      = now();
end;
$$;

revoke all on function public.set_profile_contact(text, text, text) from public, anon;
grant execute on function public.set_profile_contact(text, text, text) to authenticated;

-- ===================================================== set_practitioner_payout
create or replace function public.set_practitioner_payout(p_payshap_proxy text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
begin
  if caller is null then raise exception 'not authenticated'; end if;
  if coalesce(btrim(p_payshap_proxy), '') = '' then
    raise exception 'a PayShap proxy is required';
  end if;

  insert into public.practitioner_payout (practitioner_id, payshap_proxy)
  values (caller, btrim(p_payshap_proxy))
  on conflict (practitioner_id) do update set
    payshap_proxy = excluded.payshap_proxy,
    updated_at    = now();
end;
$$;

revoke all on function public.set_practitioner_payout(text) from public, anon;
grant execute on function public.set_practitioner_payout(text) to authenticated;

commit;
