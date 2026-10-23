-- 11 — Revoke EXECUTE on trigger functions from the API roles.
--
-- Migrations 02, 04, 05 and 06 added five trigger functions but did not repeat
-- the hardening that 07_harden_function_grants / 11_reharden_grants applied to
-- the original ones. The result (confirmed by the Supabase security advisor on
-- 2026-10-23) is that these were callable as RPCs by anon and authenticated:
--
--   mirror_profile_contact()         SECURITY DEFINER
--   mirror_practitioner_payout()     SECURITY DEFINER
--   mirror_practitioner_taxonomy()   SECURITY DEFINER
--   reviews_enforce_parties()        SECURITY DEFINER
--   profiles_derive_full_name()      SECURITY INVOKER
--
-- while every pre-existing trigger function already had EXECUTE revoked.
--
-- Direct calls would fail anyway ("record new is not assigned yet"), so this is
-- hardening rather than an exploited hole — but a SECURITY DEFINER function
-- should never be reachable through /rest/v1/rpc, and the repo's own convention
-- is to revoke.
--
-- Written generically over every trigger-returning function in `public`, so
-- future trigger functions are covered without another migration.

begin;

do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      join pg_type t on t.oid = p.prorettype
     where n.nspname = 'public'
       and t.typname = 'trigger'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', fn.sig);
  end loop;
end;
$$;

commit;

-- Verification (should return zero rows):
--
--   select p.proname
--     from pg_proc p
--     join pg_namespace n on n.oid = p.pronamespace
--     join pg_type t on t.oid = p.prorettype
--    where n.nspname = 'public' and t.typname = 'trigger'
--      and (has_function_privilege('anon', p.oid, 'EXECUTE')
--        or has_function_privilege('authenticated', p.oid, 'EXECUTE'));
