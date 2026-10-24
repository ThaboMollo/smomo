-- EMERGENCY ROLLBACK for migrations 12 + 13.
--
-- Restores the pre-12 grant state: table-wide INSERT/UPDATE/DELETE for `authenticated`.
-- This REOPENS the privilege-escalation hole (any user can set profiles.is_admin = true),
-- so use it only to restore service while a missed column grant is diagnosed, and roll
-- forward again as soon as the grant list is corrected.
--
-- The 13 RPCs are left in place: they are additive and harmless. The API calls them, so
-- dropping them would break admin actions.

begin;

grant insert, update, delete on public.profiles              to authenticated;
grant insert, update, delete on public.practitioner_profiles to authenticated;
grant insert, update, delete on public.bookings              to authenticated;
grant insert, update, delete on public.payments              to authenticated;
grant insert, update, delete on public.subscriptions         to authenticated;
grant insert, update, delete on public.reports               to authenticated;

commit;
