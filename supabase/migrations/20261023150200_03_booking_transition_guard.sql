-- 03 — Validate WHICH state a booking moves from, not just who moves it.
--
-- The existing booking_status_guard() (migration 04_requests_offers_bookings_
-- payments) already enforces the actor and stamps in_progress_at /
-- completed_at / cancelled_at / cancelled_by. What it does not check is the
-- source state, so these all succeed today:
--     cancelled  -> completed
--     completed  -> in_progress
--     completed  -> cancelled
-- The API cannot catch this either: start/complete/cancel update by id alone.
--
-- This replaces the function, keeping every existing behaviour and adding a
-- transition matrix. Terminal states stay terminal; an admin can still
-- override, which is how disputes get unwound.

begin;

create or replace function public.booking_status_guard()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if new.status is distinct from old.status then

    -- ---- who may make this transition (unchanged) ----
    if new.status in ('in_progress','completed') then
      if auth.uid() <> old.practitioner_id and not public.is_admin() then
        raise exception 'only the practitioner can start/complete a booking';
      end if;
    elsif new.status = 'cancelled' then
      if auth.uid() not in (old.client_id, old.practitioner_id) and not public.is_admin() then
        raise exception 'only a party can cancel';
      end if;
    end if;

    -- ---- which transitions are legal (new) ----
    -- confirmed   -> in_progress | completed | cancelled
    -- in_progress -> completed | cancelled
    -- completed   -> (terminal)
    -- cancelled   -> (terminal)
    if not public.is_admin() then
      if old.status in ('completed','cancelled') then
        raise exception 'booking is already % and cannot change state', old.status;
      end if;
      if old.status = 'in_progress' and new.status = 'confirmed' then
        raise exception 'a booking in progress cannot return to confirmed';
      end if;
    end if;

    -- ---- audit stamps (unchanged) ----
    if new.status = 'cancelled' then
      new.cancelled_at := now();
      new.cancelled_by := auth.uid();
    end if;
    if new.status = 'in_progress' then new.in_progress_at := now(); end if;
    if new.status = 'completed'   then new.completed_at   := now(); end if;
  end if;

  return new;
end;
$$;

comment on function public.booking_status_guard() is
  'Enforces who may change a booking status, which transitions are legal, and stamps the audit timestamps.';

commit;
