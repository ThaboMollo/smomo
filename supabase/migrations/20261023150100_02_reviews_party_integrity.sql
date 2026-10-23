-- 02 — Make a review's parties derivable from its booking, not caller-supplied.
--
-- Problem (verified against production on 2026-10-23):
--   policy rv_insert_own = WITH CHECK (auth.uid() = reviewer_id)
-- It checks only that you are who you say you are. It never checks that you
-- are party to the booking, nor that reviewee_id is the counterparty. The API
-- takes the counterparty straight from the request body:
--   POST /v1/bookings/:id/complete  -> body.clientId      -> reviews.reviewee_id
--   POST /v1/reviews/client         -> body.practitionerId -> reviews.reviewee_id
-- So a caller could attach a review to a booking they are not part of and aim
-- it at an arbitrary user. recompute_ratings() would then move that user's
-- rating, and portfolio_from_proof() would create a portfolio row.
--
-- (booking_id, direction) functionally determines both parties, so this
-- derives reviewee_id in the database and rejects a mismatched reviewer.
-- That also removes the 3NF transitive dependency in practice: the columns
-- stay for RLS and index reasons, but they can no longer disagree with the
-- booking.

begin;

create or replace function public.reviews_enforce_parties()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  b record;
begin
  select client_id, practitioner_id, status
    into b
    from public.bookings
   where id = new.booking_id;

  if b is null then
    raise exception 'review references an unknown booking';
  end if;

  if b.status <> 'completed' then
    raise exception 'only a completed booking can be reviewed (booking is %)', b.status;
  end if;

  if new.direction = 'c2p' then
    if new.reviewer_id <> b.client_id then
      raise exception 'only the client of this booking can leave a client-to-practitioner review';
    end if;
    new.reviewee_id := b.practitioner_id;
  else
    if new.reviewer_id <> b.practitioner_id then
      raise exception 'only the practitioner of this booking can leave a practitioner-to-client review';
    end if;
    new.reviewee_id := b.client_id;
  end if;

  return new;
end;
$$;

comment on function public.reviews_enforce_parties() is
  'Derives reviews.reviewee_id from (booking_id, direction) and rejects a reviewer who is not that party.';

drop trigger if exists reviews_enforce_parties on public.reviews;
create trigger reviews_enforce_parties
  before insert or update of booking_id, direction, reviewer_id, reviewee_id
  on public.reviews
  for each row execute function public.reviews_enforce_parties();

-- ----------------------------------------------------------------------------
-- Scope rv_select. The old policy let ANY practitioner read every p2c review
-- in the system (the `profiles.is_practitioner` clause). No screen reads p2c
-- reviews today; keep the client-vetting intent but limit it to practitioners
-- who actually share a booking with that client.
-- ----------------------------------------------------------------------------
drop policy if exists rv_select on public.reviews;
create policy rv_select on public.reviews
  for select
  using (
    direction = 'c2p'::review_direction          -- provider reviews are public
    or auth.uid() = reviewer_id
    or auth.uid() = reviewee_id
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
       where b.client_id = reviews.reviewee_id
         and b.practitioner_id = auth.uid()
    )
  );

commit;
