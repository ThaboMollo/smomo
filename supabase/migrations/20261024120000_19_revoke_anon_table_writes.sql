-- 19. `anon` loses its write privileges. Finishes what migration 12 started.
--
-- Found while verifying migration 18: its
--   revoke insert (verification_status), update (verification_status) ... from anon
-- was a no-op, because `anon`'s privilege is **table-level**, and a column-level revoke
-- cannot take away a table-level grant. Checking more widely, `anon` holds table-level
-- INSERT, UPDATE and DELETE on all 19 tables in `public` — including `user_identity`
-- (ID numbers), `payments`, `practitioner_payout` and `profile_contact`.
--
-- That is Supabase's default `grant all on all tables to anon, authenticated`. Migration
-- 12 replaced it with column grants for `authenticated` but never touched `anon`, so the
-- unauthenticated role ended up with *broader* table privileges than the authenticated
-- one.
--
-- Not currently exploitable, and this migration is not a fix for a live hole: RLS is
-- enabled on every one of these tables, every write policy requires `auth.uid()` to equal
-- the owning id, and `auth.uid()` is null for `anon`, so the policies deny. DELETE has no
-- policy at all on most tables, which denies by default. Verified: no policy is scoped to
-- the `anon` role.
--
-- It is worth closing anyway. The grant is the second half of the defence, and leaving it
-- means a single future mistake — one permissive policy, one `disable row level security`
-- during a debugging session — turns into anonymous writes to ID numbers and payments.
--
-- Nothing legitimately writes as `anon`. The public SEO endpoints only read, and an
-- "anonymous" app user is created with `signInAnonymously()`, which issues a real JWT and
-- therefore uses the `authenticated` role, not this one. SELECT is deliberately untouched:
-- migration 01 already pared anon's reads down to the columns the public pages need.

begin;

do $$
declare t record;
begin
  for t in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'v')      -- tables and the directory view
  loop
    execute format('revoke insert, update, delete, truncate on public.%I from anon', t.relname);
  end loop;
end $$;

-- And stop the next table inheriting the same default.
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;

commit;
