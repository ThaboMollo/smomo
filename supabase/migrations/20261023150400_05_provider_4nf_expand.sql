-- 05 — Normalise the provider model to 4NF (expand phase).
--
-- practitioner_profiles currently carries two INDEPENDENT multi-valued facts
-- about one provider:
--     practitioner -> category        via categories service_category[]
--     practitioner -> social account  via instagram/facebook/tiktok/x_handle
-- Two unrelated multi-valued dependencies in one relation is the textbook 4NF
-- violation; the array is also a 1NF repeating group, and the four social
-- columns mean adding a platform needs DDL. The array additionally duplicates
-- what services.category already says — on 2026-10-23 two providers listed a
-- category with no matching services row.
--
-- EXPAND PHASE. New tables are created, backfilled, and kept in sync from the
-- legacy columns, so the running app is untouched. search_providers() and
-- feed_requests_for_practitioner() are rewritten to read the junction table
-- (their signatures are unchanged, so the API and DTOs are unaffected), and a
-- directory view reconstitutes categories as an array so PostgREST filters
-- keep working after the columns go. Migration 08 drops the legacy columns.

begin;

-- ===================================================== practitioner_categories
create table if not exists public.practitioner_categories (
  practitioner_id uuid not null references public.practitioner_profiles(id) on delete cascade,
  category        public.service_category not null,
  created_at      timestamptz not null default now(),
  primary key (practitioner_id, category)
);

comment on table public.practitioner_categories is
  'The crafts a provider offers. One row per (provider, category) — replaces practitioner_profiles.categories[].';

create index if not exists pcat_category_idx on public.practitioner_categories (category);

insert into public.practitioner_categories (practitioner_id, category)
select pp.id, u.category
  from public.practitioner_profiles pp
 cross join lateral unnest(pp.categories) as u(category)
on conflict do nothing;

alter table public.practitioner_categories enable row level security;

drop policy if exists pcat_select_all on public.practitioner_categories;
create policy pcat_select_all on public.practitioner_categories
  for select using (true);

drop policy if exists pcat_write_own on public.practitioner_categories;
create policy pcat_write_own on public.practitioner_categories
  for all using (auth.uid() = practitioner_id or public.is_admin())
          with check (auth.uid() = practitioner_id or public.is_admin());

grant select on public.practitioner_categories to anon, authenticated;

-- ======================================================== practitioner_socials
do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                  where t.typname = 'social_platform' and n.nspname = 'public') then
    create type public.social_platform as enum ('instagram','facebook','tiktok','x');
  end if;
end;
$$;

create table if not exists public.practitioner_socials (
  practitioner_id uuid not null references public.practitioner_profiles(id) on delete cascade,
  platform        public.social_platform not null,
  handle          text not null check (length(btrim(handle)) between 1 and 50),
  created_at      timestamptz not null default now(),
  primary key (practitioner_id, platform)
);

comment on table public.practitioner_socials is
  'A provider''s social handles, one row per platform — replaces the instagram/facebook/tiktok/x_handle columns. Adding a platform is now an enum value, not a column.';

insert into public.practitioner_socials (practitioner_id, platform, handle)
select pp.id, v.platform, v.handle
  from public.practitioner_profiles pp
 cross join lateral (
   values ('instagram'::public.social_platform, pp.instagram),
          ('facebook'::public.social_platform,  pp.facebook),
          ('tiktok'::public.social_platform,    pp.tiktok),
          ('x'::public.social_platform,         pp.x_handle)
 ) as v(platform, handle)
 where v.handle is not null and btrim(v.handle) <> ''
on conflict do nothing;

alter table public.practitioner_socials enable row level security;

drop policy if exists psoc_select_all on public.practitioner_socials;
create policy psoc_select_all on public.practitioner_socials
  for select using (true);

drop policy if exists psoc_write_own on public.practitioner_socials;
create policy psoc_write_own on public.practitioner_socials
  for all using (auth.uid() = practitioner_id or public.is_admin())
          with check (auth.uid() = practitioner_id or public.is_admin());

grant select on public.practitioner_socials to anon, authenticated;

-- ============================================ keep junction tables in sync
-- The shipped app still PUTs categories[] and the four social columns through
-- /v1/practitioner/profile. Mirror those writes into the junction tables so
-- they are authoritative from the moment this lands. Dropped in migration 10.

create or replace function public.mirror_practitioner_taxonomy()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  delete from public.practitioner_categories
   where practitioner_id = new.id
     and not (category = any (coalesce(new.categories, '{}'::public.service_category[])));

  insert into public.practitioner_categories (practitioner_id, category)
  select new.id, u.category
    from unnest(coalesce(new.categories, '{}'::public.service_category[])) as u(category)
  on conflict do nothing;

  delete from public.practitioner_socials ps
   where ps.practitioner_id = new.id
     and ps.platform in ('instagram','facebook','tiktok','x')
     and coalesce(btrim(case ps.platform
           when 'instagram' then new.instagram
           when 'facebook'  then new.facebook
           when 'tiktok'    then new.tiktok
           when 'x'         then new.x_handle
         end), '') = '';

  insert into public.practitioner_socials (practitioner_id, platform, handle)
  select new.id, v.platform, btrim(v.handle)
    from (values ('instagram'::public.social_platform, new.instagram),
                 ('facebook'::public.social_platform,  new.facebook),
                 ('tiktok'::public.social_platform,    new.tiktok),
                 ('x'::public.social_platform,         new.x_handle)
         ) as v(platform, handle)
   where coalesce(btrim(v.handle), '') <> ''
  on conflict (practitioner_id, platform) do update set handle = excluded.handle;

  return new;
end;
$$;

drop trigger if exists practitioner_profiles_mirror_taxonomy on public.practitioner_profiles;
create trigger practitioner_profiles_mirror_taxonomy
  after insert or update of categories, instagram, facebook, tiktok, x_handle
  on public.practitioner_profiles
  for each row execute function public.mirror_practitioner_taxonomy();

-- ================================================== practitioner_directory view
-- Reconstitutes categories as an array and socials as JSON so the public
-- listing filters (`categories=cs.{...}`) keep working once the columns are
-- gone. It also supplies min_price, which the API currently hard-codes to null
-- in apps/api/src/modules/public.ts (toListItem).
create or replace view public.practitioner_directory
with (security_invoker = on) as
select
  pp.id,
  pp.slug,
  pp.business_name,
  pp.bio,
  pp.years_experience,
  pp.service_mode,
  pp.base_address,
  pp.base_lat,
  pp.base_lng,
  pp.travel_radius_km,
  pp.is_online,
  pp.requires_deposit,
  pp.deposit_percentage,
  pp.verification_status,
  pp.verified_at,
  pp.rating,
  pp.rating_count,
  pp.jobs_done,
  pp.created_at,
  pp.updated_at,
  p.full_name,
  p.avatar_url,
  coalesce(
    (select array_agg(pc.category order by pc.category)
       from public.practitioner_categories pc
      where pc.practitioner_id = pp.id),
    '{}'::public.service_category[]
  ) as categories,
  coalesce(
    (select jsonb_object_agg(ps.platform, ps.handle)
       from public.practitioner_socials ps
      where ps.practitioner_id = pp.id),
    '{}'::jsonb
  ) as socials,
  (select min(s.indicative_price_zar)
     from public.services s
    where s.practitioner_id = pp.id and s.is_active) as min_price
from public.practitioner_profiles pp
join public.profiles p on p.id = pp.id;

comment on view public.practitioner_directory is
  'Read model for provider listings and public profiles. Aggregates the 4NF category/social tables and exposes min_price. Excludes payout details by construction.';

grant select on public.practitioner_directory to anon, authenticated;

-- ============================== rewrite the RPCs off practitioner_profiles.categories
-- Signatures are unchanged on purpose: @smomo/shared's ProviderCard / FeedRequest
-- and the API stay exactly as they are.

create or replace function public.search_providers(
  p_lat double precision,
  p_lng double precision,
  p_category public.service_category default null::public.service_category,
  p_mode public.booking_mode default null::public.booking_mode,
  p_max_km numeric default 50
)
returns table (
  id uuid, business_name text, avatar_url text,
  categories public.service_category[], service_mode public.service_mode,
  rating numeric, rating_count integer, jobs_done integer,
  verification_status public.verification_status, is_online boolean,
  min_price numeric, distance_km numeric,
  lat double precision, lng double precision
)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  with me as (select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as g)
  select
    pp.id, pp.business_name, pr.avatar_url,
    coalesce((select array_agg(pc.category order by pc.category)
                from public.practitioner_categories pc
               where pc.practitioner_id = pp.id),
             '{}'::public.service_category[]) as categories,
    pp.service_mode,
    pp.rating, pp.rating_count, pp.jobs_done, pp.verification_status, pp.is_online,
    (select min(indicative_price_zar) from public.services s
       where s.practitioner_id = pp.id and s.is_active
         and (p_category is null or s.category = p_category)) as min_price,
    round((st_distance(pp.base_location, me.g) / 1000)::numeric, 2) as distance_km,
    pp.base_lat as lat, pp.base_lng as lng
  from public.practitioner_profiles pp
  join public.profiles pr on pr.id = pp.id
  cross join me
  where pp.is_online and pp.base_location is not null
    and (p_category is null or exists (
          select 1 from public.practitioner_categories pc
           where pc.practitioner_id = pp.id and pc.category = p_category))
    and (
      ( (p_mode = 'mobile' or p_mode is null) and pp.service_mode in ('mobile','both')
        and st_distance(pp.base_location, me.g) / 1000 <= pp.travel_radius_km )
      or
      ( (p_mode = 'studio' or p_mode is null) and pp.service_mode in ('studio','both')
        and st_distance(pp.base_location, me.g) / 1000 <= p_max_km )
    )
  order by distance_km asc;
$$;

create or replace function public.feed_requests_for_practitioner(
  p_studio_radius_km numeric default 50
)
returns table (
  request_id uuid, client_id uuid, client_name text, client_rating numeric,
  category public.service_category, description text,
  booking_mode public.booking_mode, address text,
  scheduled_at timestamptz, budget_min numeric, budget_max numeric,
  image_url text, expires_at timestamptz, distance_km numeric,
  has_offered boolean, created_at timestamptz
)
language plpgsql
stable
security definer
set search_path to 'public', 'extensions'
as $$
declare
  caller uuid := auth.uid();
  me     record;
  sub_ok boolean;
begin
  select * into me from public.practitioner_profiles where id = caller;
  if me is null then return; end if;

  select (status in ('trialing','active')) into sub_ok
    from public.subscriptions where practitioner_id = caller;
  if not coalesce(sub_ok, false) or me.verification_status <> 'verified' or not me.is_online then
    return;
  end if;

  return query
  select
    br.id, br.client_id, pr.full_name, pr.client_rating,
    br.category, br.description, br.booking_mode, br.address, br.scheduled_at,
    br.budget_min, br.budget_max, br.image_url, br.expires_at,
    round((st_distance(br.location, me.base_location) / 1000)::numeric, 2) as distance_km,
    exists (select 1 from public.request_offers ro
              where ro.request_id = br.id and ro.practitioner_id = caller
                and ro.status <> 'withdrawn') as has_offered,
    br.created_at
  from public.booking_requests br
  join public.profiles pr on pr.id = br.client_id
  where br.status = 'open'
    and br.expires_at > now()
    and br.client_id <> caller
    and (br.target_practitioner_id is null or br.target_practitioner_id = caller)
    and exists (select 1 from public.practitioner_categories pc
                 where pc.practitioner_id = caller and pc.category = br.category)
    and me.base_location is not null
    and (
      ( br.booking_mode = 'mobile' and me.service_mode in ('mobile','both')
        and st_distance(br.location, me.base_location) / 1000 <= me.travel_radius_km )
      or
      ( br.booking_mode = 'studio' and me.service_mode in ('studio','both')
        and st_distance(br.location, me.base_location) / 1000 <= p_studio_radius_km )
    )
  order by br.created_at desc;
end;
$$;

revoke all on function public.search_providers(double precision, double precision, public.service_category, public.booking_mode, numeric) from public, anon;
grant execute on function public.search_providers(double precision, double precision, public.service_category, public.booking_mode, numeric) to authenticated;

revoke all on function public.feed_requests_for_practitioner(numeric) from public, anon;
grant execute on function public.feed_requests_for_practitioner(numeric) to authenticated;

commit;
