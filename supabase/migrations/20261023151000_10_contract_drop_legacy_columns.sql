-- 10 — CONTRACT PHASE. Drop the legacy columns that migrations 04 and 05
--      replaced. This is the migration that actually closes the signed-in PII
--      exposure and completes 4NF.
--
--      *** DO NOT APPLY THIS UNTIL THE CODE CHANGES ARE DEPLOYED. ***
--
-- Required first, in this order:
--   1. apply migrations 01 - 09
--   2. deploy the API / web / mobile changes that read from
--        profile_contact, practitioner_payout, practitioner_directory,
--        practitioner_categories, practitioner_socials
--      and write through save_business_profile() / set_profile_contact() /
--      set_practitioner_payout()
--   3. confirm nothing still reads the old columns:
--        select * from pg_stat_statements
--         where query ilike '%payshap_proxy%' or query ilike '%categories%';
--   4. then apply this file
--
-- After this runs, practitioner_profiles holds exactly one fact per column and
-- no multi-valued attributes, so the provider model is in 4NF.

begin;

-- ---------------------------------------------------------------------------
-- Stop the mirror triggers first: their source columns are about to disappear.
-- ---------------------------------------------------------------------------
drop trigger if exists profiles_mirror_contact             on public.profiles;
drop trigger if exists practitioner_profiles_mirror_payout on public.practitioner_profiles;
drop trigger if exists practitioner_profiles_mirror_taxonomy on public.practitioner_profiles;

drop function if exists public.mirror_profile_contact();
drop function if exists public.mirror_practitioner_payout();
drop function if exists public.mirror_practitioner_taxonomy();

-- ---------------------------------------------------------------------------
-- Safety check: refuse to drop anything if the new tables are not populated.
-- ---------------------------------------------------------------------------
do $$
declare
  missing_contact int;
  missing_cats    int;
begin
  select count(*) into missing_contact
    from public.profiles p
    left join public.profile_contact pc on pc.user_id = p.id
   where pc.user_id is null
     and (p.phone is not null or p.whatsapp_number is not null or p.home_address is not null);

  if missing_contact > 0 then
    raise exception 'aborting: % profiles with contact details have no profile_contact row', missing_contact;
  end if;

  select count(*) into missing_cats
    from public.practitioner_profiles pp
   where cardinality(pp.categories) > 0
     and not exists (select 1 from public.practitioner_categories pc
                      where pc.practitioner_id = pp.id);

  if missing_cats > 0 then
    raise exception 'aborting: % practitioners have categories[] but no practitioner_categories rows', missing_cats;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: contact PII now lives in profile_contact
-- ---------------------------------------------------------------------------
alter table public.profiles drop column if exists phone;
alter table public.profiles drop column if exists whatsapp_number;
alter table public.profiles drop column if exists home_address;

-- The friendly 23505 message in apps/api/src/common/all-exceptions.filter.ts
-- keys off 'profiles_phone_key'; that unique index moved with the column, so
-- the map needs 'profile_contact_phone_key' (handled in the same deploy).

-- ---------------------------------------------------------------------------
-- practitioner_profiles: payout + the two multi-valued attributes
-- ---------------------------------------------------------------------------
alter table public.practitioner_profiles drop column if exists payshap_proxy;

-- practitioner_directory and the rewritten RPCs already read the junction
-- tables, so dropping these affects nothing that remains.
alter table public.practitioner_profiles drop column if exists categories;
alter table public.practitioner_profiles drop column if exists instagram;
alter table public.practitioner_profiles drop column if exists facebook;
alter table public.practitioner_profiles drop column if exists tiktok;
alter table public.practitioner_profiles drop column if exists x_handle;

-- ---------------------------------------------------------------------------
-- Re-issue the anon grants from migration 01 without the dropped columns.
-- (REVOKE/GRANT on a dropped column is not an error, but keep it explicit.)
-- ---------------------------------------------------------------------------
revoke select on public.profiles from anon;
grant select (
  id, full_name, avatar_url, is_practitioner,
  client_rating, client_rating_count, created_at
) on public.profiles to anon;

revoke select on public.practitioner_profiles from anon;
grant select (
  id, slug, business_name, bio, years_experience, service_mode,
  base_address, base_lat, base_lng, travel_radius_km, is_online,
  requires_deposit, deposit_percentage, verification_status, verified_at,
  rating, rating_count, jobs_done, created_at, updated_at
) on public.practitioner_profiles to anon;

commit;
