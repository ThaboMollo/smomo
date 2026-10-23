-- 06 — Remove the 3NF transitive dependencies that can actually disagree.
--
-- Two redundancies in this schema are real and already drifting:
--
--   profiles.full_name  <-  first_name, last_name
--     On 2026-10-23 one row had first='Chloe', last='van', full='Chloe van Wyk'
--     — last_name had been truncated, so the two sources disagreed. Another 5
--     rows have full_name with no first/last at all.
--
--   practitioner_profiles.requires_deposit  <-  deposit_percentage
--     The boolean is fully derivable from (deposit_percentage IS NOT NULL).
--     Nothing stopped them contradicting each other; only a range CHECK existed.
--
-- Deliberately NOT changed here: lat/lng vs the PostGIS location columns.
-- They are redundant (all 10 practitioner rows decode identically, and all 14
-- booking_requests match), but location is written explicitly by
-- create_request() and accept_offer(), so converting it to a generated column
-- would mean rewriting both RPCs for no correctness gain. Left as a documented,
-- RPC-maintained denormalisation.
--
-- full_name is kept as a trigger-maintained column rather than GENERATED
-- because Postgres cannot convert an existing column in place: it would need a
-- drop/re-add, which would cascade into the practitioner_directory view and the
-- anon column grant from migration 01. A trigger gives the same single source
-- of truth without that churn.

begin;

-- ---------------------------------------------------------------- names
-- Backfill first/last FROM full_name wherever they are missing or disagree, so
-- that deriving full_name afterwards reproduces every existing value exactly.
-- 'Chloe van Wyk' -> first 'Chloe', last 'van Wyk' (repairing the truncation).
-- 'Thandi'        -> first 'Thandi', last NULL.
update public.profiles
   set first_name = split_part(btrim(full_name), ' ', 1),
       last_name  = nullif(btrim(substr(btrim(full_name),
                      length(split_part(btrim(full_name), ' ', 1)) + 2)), '')
 where coalesce(btrim(full_name), '') <> ''
   and (
     first_name is null
     or last_name is null
     or nullif(btrim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), '')
        is distinct from btrim(full_name)
   );

create or replace function public.profiles_derive_full_name()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  -- first/last are the source of truth once either is set. If neither is set,
  -- whatever full_name was supplied is kept (progressive signup writes it
  -- before the name fields exist).
  if coalesce(btrim(new.first_name), '') <> '' or coalesce(btrim(new.last_name), '') <> '' then
    new.full_name := nullif(btrim(coalesce(btrim(new.first_name), '') || ' ' ||
                                  coalesce(btrim(new.last_name), '')), '');
  end if;
  return new;
end;
$$;

comment on function public.profiles_derive_full_name() is
  'Keeps profiles.full_name derived from first_name/last_name so the two cannot disagree.';

drop trigger if exists profiles_derive_full_name on public.profiles;
create trigger profiles_derive_full_name
  before insert or update of first_name, last_name, full_name
  on public.profiles
  for each row execute function public.profiles_derive_full_name();

-- ------------------------------------------------------------- deposits
-- Normalise the two rows-shaped states first (none were incoherent on
-- 2026-10-23, but make it true by construction), then constrain it.
-- false + a percentage  -> clear the percentage
update public.practitioner_profiles
   set deposit_percentage = null
 where requires_deposit = false and deposit_percentage is not null;

-- true + no usable percentage -> the flag was meaningless, clear it
update public.practitioner_profiles
   set requires_deposit = false,
       deposit_percentage = null
 where requires_deposit = true and coalesce(deposit_percentage, 0) < 1;

alter table public.practitioner_profiles
  drop constraint if exists practitioner_profiles_deposit_coherent;

alter table public.practitioner_profiles
  add constraint practitioner_profiles_deposit_coherent check (
    (requires_deposit = false and deposit_percentage is null)
    or
    (requires_deposit = true and deposit_percentage is not null
       and deposit_percentage between 1 and 100)
  );

comment on constraint practitioner_profiles_deposit_coherent on public.practitioner_profiles is
  'requires_deposit is derivable from deposit_percentage; this stops the two disagreeing.';

commit;
