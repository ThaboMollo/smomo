-- 14. HOTFIX: signup has been failing since the contact split landed.
--
-- handle_new_user() (the SECURITY DEFINER trigger on auth.users that seeds a profile for
-- every new account) still did:
--
--     insert into public.profiles (id, phone, full_name) ...
--
-- Migration 04 moved phone/whatsapp_number/home_address to public.profile_contact and
-- mirrored writes forward; migration 10 then dropped those columns from profiles. Both
-- migrations updated the app's own write paths and removed the mirror triggers, but
-- handle_new_user() predates them and was never touched — so from the moment migration
-- 10 landed, EVERY signup aborted with:
--
--     42703  column "phone" of relation "profiles" does not exist
--
-- The statement fails at parse time, so this broke all signups, not just ones supplying
-- a phone number. Last successful auth.users insert was 2026-10-23 19:18 UTC.
--
-- Not related to migrations 12/13 (column grants): this is an undefined_column error in a
-- SECURITY DEFINER function, which runs as its owner and is unaffected by role grants.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  -- Phone now lives in profile_contact. Only write a row when there is something to
  -- store: most signups are email/password and carry no phone.
  -- Bare `on conflict do nothing` (no target) on purpose — it absorbs a conflict on the
  -- user_id primary key AND on the phone unique index. A phone already registered to
  -- someone else must never abort account creation.
  if nullif(btrim(coalesce(new.phone, '')), '') is not null then
    insert into public.profile_contact (user_id, phone)
    values (new.id, btrim(new.phone))
    on conflict do nothing;
  end if;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Seeds public.profiles (and profile_contact when the signup carries a phone) for each new auth.users row. Contact fields live in profile_contact since migration 04.';

commit;
