-- 15. RPC parameter contract — give every nullable argument a DB default.
--
-- Fixes the live 500 on PUT /practitioner/profile:
--   "Could not find the function public.save_business_profile(p_bio, p_business_name,
--    p_categories, p_deposit_percentage, p_requires_deposit, p_service_mode,
--    p_travel_radius_km) in the schema cache"
--
-- Cause (spec RC-2). PostgREST resolves an RPC overload by the EXACT set of named
-- arguments in the JSON body, and supabase-js omits any key whose value is `undefined`.
-- `save_business_profile` declared 12 arguments with defaults on only the last 5, so
-- `p_bio` and `p_years_experience` were required. Both are optional in the zod schema and
-- the API mapped them with `?? undefined`, so on the normal path their keys vanished, no
-- overload matched, and PostgREST answered PGRST202 — surfaced to the client as a 500.
--
-- The rule from here: a nullable RPC argument gets a DB default AND an explicit null from
-- the API. Either alone is a silent trap; this migration is the first half, the `?? null`
-- sweep in apps/api/src/modules/practitioner.ts is the second.
--
-- Required arguments move to the front because a default can only follow non-defaulted
-- ones. That changes the argument type sequence, so this is a NEW overload rather than a
-- replacement — the old 12-arg signature is dropped at the end so nothing stale can
-- resolve. Body is byte-for-byte the one from migration 05b.

begin;

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

-- The new signature carries its own grants; `create or replace` does not inherit them.
revoke all on function public.save_business_profile(
  text, public.service_category[], public.service_mode, numeric, boolean,
  text, integer, integer, text, text, text, text) from public, anon;
grant execute on function public.save_business_profile(
  text, public.service_category[], public.service_mode, numeric, boolean,
  text, integer, integer, text, text, text, text) to authenticated;

-- Drop the old ordering so two overloads can never both be candidates. PostgREST would
-- otherwise still fail to resolve a full 12-key body, now for ambiguity instead.
drop function if exists public.save_business_profile(
  text, text, public.service_category[], integer, public.service_mode,
  numeric, boolean, integer, text, text, text, text);

commit;
