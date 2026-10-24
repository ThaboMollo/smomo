-- 17. A practitioner never sees a client's street address until the booking exists.
--
-- Migration 16 removed `address` from `feed_requests_for_practitioner`, which closed the
-- broad leak: any eligible practitioner browsing open requests used to be handed the
-- client's street address before deciding whether to offer. One hole was left open, and
-- this closes it.
--
-- `br_select_party` allowed `auth.uid() = target_practitioner_id`, so for a *directed*
-- request — one a client aimed at a specific provider — that provider could read the whole
-- row straight off PostgREST, `address` included, with no booking and no accepted offer.
-- `GET /requests/:id` does `select('*')` and relies entirely on this policy, so both the
-- web app and the mobile app would hand it over. It also meant a directed request showed
-- up in that practitioner's own `GET /requests/mine` list, which is the client's list.
--
-- Nothing legitimate needed that read:
--   * Directed requests still reach the practitioner through
--     `feed_requests_for_practitioner` (SECURITY DEFINER, so RLS does not apply), whose
--     `target_practitioner_id is null or = caller` clause already includes them. Since
--     migration 16 that returns `city`, not `address`.
--   * Making an offer goes through `make_offer` (SECURITY DEFINER), and both apps build
--     their offer screen from the feed row they already hold — neither fetches the request.
--   * `request_offers.ro_select_party` sub-selects `booking_requests.client_id`. That
--     subquery is subject to this policy, so it now returns no row for a practitioner and
--     the comparison yields NULL — harmless, because `auth.uid() = practitioner_id` is
--     already true for them and `true OR NULL` is true.
--
-- After this, the address reaches the practitioner by exactly one route: the client accepts
-- an offer, `accept_offer` copies the address onto `bookings` with status 'confirmed', and
-- `bookings.bk_select_party` lets that practitioner read it. The `booking_status` enum has
-- no pre-confirmed state — confirmed, in_progress, completed, cancelled — so a booking
-- existing *is* a confirmed booking, and "once confirmed" needs no extra status check.
--
-- Not reversible by accident: re-adding the target clause re-opens the leak, so do it only
-- deliberately.

begin;

drop policy if exists br_select_party on public.booking_requests;

create policy br_select_party on public.booking_requests
  for select
  using (
    auth.uid() = client_id
    or public.is_admin()
  );

commit;
