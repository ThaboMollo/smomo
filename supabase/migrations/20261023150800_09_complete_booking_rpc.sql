-- 09 — Make completing a booking one transaction.
--
-- POST /v1/bookings/:id/complete currently does two separate PostgREST calls:
--     update bookings set status = 'completed'
--     insert into reviews (...)
-- If the second fails the first has already committed, so the booking is
-- complete with no practitioner-to-client review — and a retry then trips
-- reviews_booking_id_direction_key and returns 409. The equivalent flows
-- (create_request, make_offer, accept_offer) are already RPCs; this brings
-- completion in line.
--
-- It also removes the last place a caller supplied the review counterparty:
-- the client is read from the booking, never from the request body.

begin;

create or replace function public.complete_booking(
  p_booking_id      uuid,
  p_rating          integer,
  p_proof_image_url text,
  p_comment         text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
  b      record;
begin
  if caller is null then raise exception 'not authenticated'; end if;

  select client_id, practitioner_id, status
    into b
    from public.bookings
   where id = p_booking_id
     for update;

  if b is null then raise exception 'booking not found'; end if;

  if caller <> b.practitioner_id and not public.is_admin() then
    raise exception 'only the practitioner can complete this booking';
  end if;

  if b.status = 'completed' then
    raise exception 'this booking is already completed';
  end if;
  if b.status = 'cancelled' then
    raise exception 'a cancelled booking cannot be completed';
  end if;

  -- booking_status_guard() stamps completed_at and re-checks the actor.
  update public.bookings
     set status = 'completed'
   where id = p_booking_id;

  -- reviews_enforce_parties() derives reviewee_id from (booking, direction);
  -- the value passed here is the booking's own client either way.
  insert into public.reviews (
    booking_id, reviewer_id, reviewee_id, direction, rating, comment, proof_image_url
  ) values (
    p_booking_id, caller, b.client_id, 'p2c', p_rating, p_comment, p_proof_image_url
  );
end;
$$;

comment on function public.complete_booking(uuid, integer, text, text) is
  'Completes a booking and records the practitioner-to-client review atomically.';

revoke all on function public.complete_booking(uuid, integer, text, text) from public, anon;
grant execute on function public.complete_booking(uuid, integer, text, text) to authenticated;

commit;
