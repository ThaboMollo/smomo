-- 07 — Reconcile the cached rating aggregates with the reviews table.
--
-- rating / rating_count / client_rating / client_rating_count are maintained
-- correctly going forward by the recompute_ratings() trigger, and jobs_done by
-- bump_jobs_done(). But rows that predate those triggers (or were seeded
-- directly) were never reconciled. Verified on 2026-10-23:
--
--   glow-by-thandi-1111   stored rating 4.80  n=25   actual c2p reviews: 0
--   naledi-nails-2222     stored rating 4.60  n=12   actual c2p reviews: 0
--   ink-co-3333           stored rating 4.95  n=60   actual c2p reviews: 0
--
-- while the four newer providers matched their review rows exactly.
--
-- HEADS UP: this clears those three fabricated ratings (they become NULL with
-- count 0), because no review backs them. That is the correct state, but it is
-- a visible change to seeded providers.
--
-- jobs_done is intentionally NOT recomputed from bookings: a completed booking
-- is not guaranteed to still exist (ON DELETE CASCADE from profiles), so the
-- counter is an intentional lifetime tally rather than a derivable aggregate.

begin;

-- practitioner ratings, from client-to-practitioner reviews
update public.practitioner_profiles pp
   set rating       = agg.avg_rating,
       rating_count = agg.cnt
  from (
    select pp2.id,
           (select avg(r.rating)::numeric(3,2)
              from public.reviews r
             where r.reviewee_id = pp2.id and r.direction = 'c2p') as avg_rating,
           (select count(*)
              from public.reviews r
             where r.reviewee_id = pp2.id and r.direction = 'c2p') as cnt
      from public.practitioner_profiles pp2
  ) agg
 where pp.id = agg.id
   and (pp.rating is distinct from agg.avg_rating or pp.rating_count is distinct from agg.cnt);

-- client ratings, from practitioner-to-client reviews
update public.profiles pr
   set client_rating       = agg.avg_rating,
       client_rating_count = agg.cnt
  from (
    select p2.id,
           (select avg(r.rating)::numeric(3,2)
              from public.reviews r
             where r.reviewee_id = p2.id and r.direction = 'p2c') as avg_rating,
           (select count(*)
              from public.reviews r
             where r.reviewee_id = p2.id and r.direction = 'p2c') as cnt
      from public.profiles p2
  ) agg
 where pr.id = agg.id
   and (pr.client_rating is distinct from agg.avg_rating
     or pr.client_rating_count is distinct from agg.cnt);

commit;

-- Verification (run manually; should return zero rows):
--
--   select pp.slug, pp.rating, pp.rating_count,
--          (select count(*) from reviews r
--            where r.reviewee_id = pp.id and r.direction = 'c2p') as actual
--     from practitioner_profiles pp
--    where pp.rating_count <> (select count(*) from reviews r
--                               where r.reviewee_id = pp.id and r.direction = 'c2p');
