-- 16. Coordinates become optional; the typed city carries matching instead; and the
--     practitioner feed stops handing out the client's street address.
--
-- Three changes, one decision: with geolocation parked (see NEXT_PUBLIC_GEOLOCATION_ENABLED
-- / EXPO_PUBLIC_GEOLOCATION_ENABLED) there is no geocoder, so an address typed by hand has
-- no point. Rather than invent one from the city centre — which made "2.1 km away" a
-- number we could not stand behind — a request or a provider base may now have no point at
-- all, and matching falls back to the city the person typed.
--
-- Note on the starting state: `booking_requests.lat` and `.lng` were ALREADY nullable, as
-- were `practitioner_profiles.base_lat/.base_lng/.base_location`. The only NOT NULL was
-- `booking_requests.location`, the PostGIS geography column, which is what the RPCs built
-- unconditionally from lat/lng. That is the constraint this migration drops.
--
--   1. `booking_requests.location` drops NOT NULL, and both RPCs build the point only when
--      they are actually given a latitude and a longitude.
--   2. A `city` column on `booking_requests` and `practitioner_profiles`, typed by hand
--      when geolocation is off. `search_providers` and `feed_requests_for_practitioner`
--      match on it whenever either side has no point, and return `distance_km` as NULL in
--      that case rather than a fabricated number. The apps hide distance when it is null.
--   3. `feed_requests_for_practitioner` no longer returns `address`. It returns `city`.
--      The full street address reaches the practitioner only once a booking exists:
--      `accept_offer` copies it onto `bookings` with status 'confirmed', and
--      `bookings.bk_select_party` lets that practitioner read it from there. Browsing the
--      open feed no longer discloses where anyone lives.
--
-- Column grants are per-column on these tables (migrations 01 and 12), so a new column is
-- invisible until granted. `city` is granted SELECT only — writes go through the RPCs,
-- which is the rule migration 12 established.
--
-- Return types change, so the two read RPCs are dropped and recreated rather than
-- replaced. Every signature here follows the RC-2 rule: nullable arguments carry a DB
-- default, and the API sends an explicit null.

begin;

-- ───────────────────────────── 1. The point becomes optional
alter table public.booking_requests alter column location drop not null;

-- ───────────────────────────── 2. The typed city
alter table public.booking_requests      add column if not exists city text;
alter table public.practitioner_profiles add column if not exists city text;

comment on column public.booking_requests.city is
  'City/town as typed by the client. Carries matching when `location` is null (geolocation parked).';
comment on column public.practitioner_profiles.city is
  'City/town of the base, as typed. Carries matching when `base_location` is null.';

-- Read-only for clients; both columns are written by the RPCs below, never directly.
grant select (city) on public.booking_requests      to authenticated;
grant select (city) on public.practitioner_profiles to authenticated;

-- The matching predicate is `lower(btrim(city))` on both sides, so index exactly that.
create index if not exists booking_requests_city_idx
  on public.booking_requests (lower(btrim(city))) where city is not null;
create index if not exists practitioner_profiles_city_idx
  on public.practitioner_profiles (lower(btrim(city))) where city is not null;

-- ───────────────────────────── 3. create_request
-- p_lat/p_lng move behind the required arguments so they can default to null, and p_city
-- joins them. A request with neither a point nor a city could never be matched by either
-- path, so it is refused here with a message the API can show.
create or replace function public.create_request(
  p_category         public.service_category,
  p_booking_mode     public.booking_mode,
  p_lat              double precision default null,
  p_lng              double precision default null,
  p_description      text             default null,
  p_address          text             default null,
  p_city             text             default null,
  p_scheduled_at     timestamptz      default null,
  p_budget_min       numeric          default null,
  p_budget_max       numeric          default null,
  p_image_url        text             default null,
  p_target           uuid             default null,
  p_consent          boolean          default false,
  p_expires_minutes  integer          default 30
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
declare new_id uuid; v_expires timestamptz; v_point extensions.geography;
begin
  if (p_lat is null or p_lng is null) and coalesce(btrim(p_city), '') = '' then
    raise exception 'a request needs either coordinates or a city'
      using errcode = 'P0001';
  end if;

  -- Null unless we were given both halves of a coordinate. st_makepoint is strict, so this
  -- guard is about intent, not about avoiding an error.
  v_point := case
    when p_lat is not null and p_lng is not null
      then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
  end;

  v_expires := case
    when p_scheduled_at is not null then p_scheduled_at
    else now() + make_interval(mins => greatest(p_expires_minutes, 5))
  end;

  insert into public.booking_requests (
    client_id, target_practitioner_id, category, description, booking_mode,
    location, lat, lng, address, city, scheduled_at, budget_min, budget_max, image_url,
    status, expires_at, client_consented_to_portfolio
  ) values (
    auth.uid(), p_target, p_category, p_description, p_booking_mode,
    v_point, p_lat, p_lng, p_address, nullif(btrim(p_city), ''),
    p_scheduled_at, p_budget_min, p_budget_max, p_image_url,
    'open', v_expires, p_consent
  ) returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.create_request(
  public.service_category, public.booking_mode, double precision, double precision, text,
  text, text, timestamptz, numeric, numeric, text, uuid, boolean, integer) from public, anon;
grant execute on function public.create_request(
  public.service_category, public.booking_mode, double precision, double precision, text,
  text, text, timestamptz, numeric, numeric, text, uuid, boolean, integer)
  to authenticated, service_role;

drop function if exists public.create_request(
  public.service_category, public.booking_mode, double precision, double precision, text,
  text, timestamptz, numeric, numeric, text, uuid, boolean, integer);

-- ───────────────────────────── 4. set_practitioner_location
-- The point is now whatever we were given, including nothing. The two text fields keep
-- their coalesce so refreshing a GPS fix does not wipe an address typed earlier.
create or replace function public.set_practitioner_location(
  p_lat     double precision default null,
  p_lng     double precision default null,
  p_address text             default null,
  p_city    text             default null
)
returns void
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $$
begin
  update public.practitioner_profiles
     set base_location = case
           when p_lat is not null and p_lng is not null
             then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
         end,
         base_lat     = p_lat,
         base_lng     = p_lng,
         base_address = coalesce(p_address, base_address),
         city         = coalesce(nullif(btrim(p_city), ''), city)
   where id = auth.uid();
  if not found then raise exception 'no practitioner profile for current user'; end if;
end;
$$;

revoke all on function public.set_practitioner_location(
  double precision, double precision, text, text) from public, anon;
grant execute on function public.set_practitioner_location(
  double precision, double precision, text, text) to authenticated, service_role;

drop function if exists public.set_practitioner_location(double precision, double precision, text);


-- ───────────────────────────── 5. search_providers
-- Two matching paths. When the caller and the provider both have a point, the existing
-- distance filter is used unchanged. When either side has none, the typed city decides,
-- and distance_km comes back NULL so no caller can print a number we invented.
--
-- p_lat/p_lng gain defaults: with geolocation parked the apps have no coordinates to send.
-- The return TYPE is unchanged, but the argument list is, so the old signature is dropped.
--
-- Deliberately NOT fixed here: p_max_km still applies only to the studio branch (spec
-- RC-5). Changing that is a separate behaviour change, and mixing it in would make this
-- migration impossible to review.
create or replace function public.search_providers(
  p_lat      double precision        default null,
  p_lng      double precision        default null,
  p_category public.service_category default null,
  p_mode     public.booking_mode     default null,
  p_max_km   numeric                 default 50,
  p_city     text                    default null
)
returns table (
  id uuid, business_name text, avatar_url text,
  categories public.service_category[], service_mode public.service_mode,
  rating numeric, rating_count integer, jobs_done integer,
  verification_status public.verification_status, is_online boolean,
  min_price numeric, distance_km numeric, lat double precision, lng double precision
)
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $$
  with me as (
    select case
             when p_lat is not null and p_lng is not null
               then extensions.st_setsrid(extensions.st_makepoint(p_lng, p_lat), 4326)::extensions.geography
           end as g,
           nullif(lower(btrim(coalesce(p_city, ''))), '') as city_key
  )
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
    case
      when me.g is not null and pp.base_location is not null
        then round((extensions.st_distance(pp.base_location, me.g) / 1000)::numeric, 2)
    end as distance_km,
    pp.base_lat as lat, pp.base_lng as lng
  from public.practitioner_profiles pp
  join public.profiles pr on pr.id = pp.id
  cross join me
  where pp.is_online
    and (p_category is null or exists (
          select 1 from public.practitioner_categories pc
           where pc.practitioner_id = pp.id and pc.category = p_category))
    and (
      -- Located on both sides: the original distance rules, untouched.
      ( me.g is not null and pp.base_location is not null
        and (
          ( (p_mode = 'mobile' or p_mode is null) and pp.service_mode in ('mobile','both')
            and extensions.st_distance(pp.base_location, me.g) / 1000 <= pp.travel_radius_km )
          or
          ( (p_mode = 'studio' or p_mode is null) and pp.service_mode in ('studio','both')
            and extensions.st_distance(pp.base_location, me.g) / 1000 <= p_max_km )
        ) )
      or
      -- Either side unlocated: same city, and the mode still has to be compatible.
      ( (me.g is null or pp.base_location is null)
        and me.city_key is not null
        and lower(btrim(pp.city)) = me.city_key
        and ( p_mode is null
              or pp.service_mode = 'both'
              or pp.service_mode::text = p_mode::text ) )
    )
  -- Located matches first and nearest-first among them; city matches after, best-rated first.
  order by distance_km asc nulls last, pp.rating desc nulls last, pp.jobs_done desc;
$$;

revoke all on function public.search_providers(
  double precision, double precision, public.service_category, public.booking_mode,
  numeric, text) from public, anon;
grant execute on function public.search_providers(
  double precision, double precision, public.service_category, public.booking_mode,
  numeric, text) to authenticated, service_role;

drop function if exists public.search_providers(
  double precision, double precision, public.service_category, public.booking_mode, numeric);

-- ───────────────────────────── 6. feed_requests_for_practitioner
-- `address` is replaced by `city`. That is the privacy change: a practitioner browsing the
-- open feed sees the town, decides whether to offer, and only learns the street address if
-- the client accepts — `accept_offer` copies it onto `bookings`, which bk_select_party then
-- lets them read. The signature is unchanged but the RETURN TYPE is not, so this one has to
-- be dropped before it can be recreated.
drop function if exists public.feed_requests_for_practitioner(numeric);

create function public.feed_requests_for_practitioner(
  p_studio_radius_km numeric default 50
)
returns table (
  request_id uuid, client_id uuid, client_name text, client_rating numeric,
  category public.service_category, description text, booking_mode public.booking_mode,
  city text, scheduled_at timestamptz,
  budget_min numeric, budget_max numeric, image_url text, expires_at timestamptz,
  distance_km numeric, has_offered boolean, created_at timestamptz
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
    br.category, br.description, br.booking_mode,
    br.city,                      -- the town only; the street address waits for a booking
    br.scheduled_at,
    br.budget_min, br.budget_max, br.image_url, br.expires_at,
    case
      when br.location is not null and me.base_location is not null
        then round((extensions.st_distance(br.location, me.base_location) / 1000)::numeric, 2)
    end as distance_km,
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
    and (
      -- Located on both sides: the original radius rules, untouched.
      ( br.location is not null and me.base_location is not null
        and (
          ( br.booking_mode = 'mobile' and me.service_mode in ('mobile','both')
            and extensions.st_distance(br.location, me.base_location) / 1000 <= me.travel_radius_km )
          or
          ( br.booking_mode = 'studio' and me.service_mode in ('studio','both')
            and extensions.st_distance(br.location, me.base_location) / 1000 <= p_studio_radius_km )
        ) )
      or
      -- Either side unlocated: same city, mode still has to be compatible.
      ( (br.location is null or me.base_location is null)
        and nullif(lower(btrim(coalesce(br.city, ''))), '') is not null
        and lower(btrim(br.city)) = lower(btrim(coalesce(me.city, '')))
        and ( ( br.booking_mode = 'mobile' and me.service_mode in ('mobile','both') )
           or ( br.booking_mode = 'studio' and me.service_mode in ('studio','both') ) ) )
    )
  order by br.created_at desc;
end;
$$;

revoke all on function public.feed_requests_for_practitioner(numeric) from public, anon;
grant execute on function public.feed_requests_for_practitioner(numeric) to authenticated, service_role;

commit;
