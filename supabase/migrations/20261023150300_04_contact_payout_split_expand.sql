-- 04 — Move contact PII and payout details into tables that can be
--      row-secured, so signed-in users stop seeing each other's details.
--
-- Migration 01 closed the anonymous hole with column privileges, but
-- `authenticated` still has full SELECT on profiles and practitioner_profiles,
-- and RLS is all-or-nothing per row — it cannot hide one column. The fix is to
-- relocate the sensitive columns into tables whose RLS matches who actually
-- needs them, which the code audit established precisely:
--
--   phone            self, admin, and the counterparty on a booking
--                    (booking page renders a tel: link for `other.phone`)
--   whatsapp_number  self only  (read on the profile edit screen)
--   home_address     self only  (read on the profile edit screen)
--   payshap_proxy    self, admin, and a client who has a booking with that
--                    practitioner (booking page shows it so they can pay)
--
-- EXPAND PHASE. The new tables are created, backfilled, and kept in sync from
-- the legacy columns by triggers, so the running app is unaffected. Reads move
-- over in the accompanying deploy; migration 10 then drops the old columns.
-- The signed-in exposure is not closed until 08.

begin;

-- ============================================================ profile_contact
create table if not exists public.profile_contact (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  phone           text unique,
  whatsapp_number text,
  home_address    text,
  updated_at      timestamptz not null default now()
);

comment on table public.profile_contact is
  'Contact details for a user. Separate from profiles because profiles is publicly readable.';

insert into public.profile_contact (user_id, phone, whatsapp_number, home_address)
select id, phone, whatsapp_number, home_address
  from public.profiles
on conflict (user_id) do update
  set phone           = excluded.phone,
      whatsapp_number = excluded.whatsapp_number,
      home_address    = excluded.home_address,
      updated_at      = now();

alter table public.profile_contact enable row level security;

drop policy if exists pc_select_self_admin_or_counterparty on public.profile_contact;
create policy pc_select_self_admin_or_counterparty on public.profile_contact
  for select using (
    auth.uid() = user_id
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
       where (b.client_id = profile_contact.user_id and b.practitioner_id = auth.uid())
          or (b.practitioner_id = profile_contact.user_id and b.client_id = auth.uid())
    )
  );

drop policy if exists pc_insert_own on public.profile_contact;
create policy pc_insert_own on public.profile_contact
  for insert with check (auth.uid() = user_id);

drop policy if exists pc_update_own on public.profile_contact;
create policy pc_update_own on public.profile_contact
  for update using (auth.uid() = user_id or public.is_admin())
              with check (auth.uid() = user_id or public.is_admin());

drop trigger if exists profile_contact_set_updated_at on public.profile_contact;
create trigger profile_contact_set_updated_at
  before update on public.profile_contact
  for each row execute function public.set_updated_at();

-- ======================================================== practitioner_payout
create table if not exists public.practitioner_payout (
  practitioner_id uuid primary key references public.practitioner_profiles(id) on delete cascade,
  payshap_proxy   text,
  updated_at      timestamptz not null default now()
);

comment on table public.practitioner_payout is
  'Where a practitioner gets paid. Visible to the practitioner, an admin, and clients who have a booking with them.';

insert into public.practitioner_payout (practitioner_id, payshap_proxy)
select id, payshap_proxy
  from public.practitioner_profiles
on conflict (practitioner_id) do update
  set payshap_proxy = excluded.payshap_proxy,
      updated_at    = now();

alter table public.practitioner_payout enable row level security;

drop policy if exists ppo_select_self_admin_or_client on public.practitioner_payout;
create policy ppo_select_self_admin_or_client on public.practitioner_payout
  for select using (
    auth.uid() = practitioner_id
    or public.is_admin()
    or exists (
      select 1 from public.bookings b
       where b.practitioner_id = practitioner_payout.practitioner_id
         and b.client_id = auth.uid()
    )
  );

drop policy if exists ppo_insert_own on public.practitioner_payout;
create policy ppo_insert_own on public.practitioner_payout
  for insert with check (auth.uid() = practitioner_id);

drop policy if exists ppo_update_own on public.practitioner_payout;
create policy ppo_update_own on public.practitioner_payout
  for update using (auth.uid() = practitioner_id or public.is_admin())
              with check (auth.uid() = practitioner_id or public.is_admin());

drop trigger if exists practitioner_payout_set_updated_at on public.practitioner_payout;
create trigger practitioner_payout_set_updated_at
  before update on public.practitioner_payout
  for each row execute function public.set_updated_at();

-- ================================================ keep legacy columns in sync
-- The shipped app still writes profiles.phone / practitioner_profiles
-- .payshap_proxy. Mirror those writes forward so the new tables are correct
-- from the moment this migration lands. Both triggers go away in migration 10.

create or replace function public.mirror_profile_contact()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.profile_contact (user_id, phone, whatsapp_number, home_address)
  values (new.id, new.phone, new.whatsapp_number, new.home_address)
  on conflict (user_id) do update
    set phone           = excluded.phone,
        whatsapp_number = excluded.whatsapp_number,
        home_address    = excluded.home_address,
        updated_at      = now();
  return new;
end;
$$;

drop trigger if exists profiles_mirror_contact on public.profiles;
create trigger profiles_mirror_contact
  after insert or update of phone, whatsapp_number, home_address
  on public.profiles
  for each row execute function public.mirror_profile_contact();

create or replace function public.mirror_practitioner_payout()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  insert into public.practitioner_payout (practitioner_id, payshap_proxy)
  values (new.id, new.payshap_proxy)
  on conflict (practitioner_id) do update
    set payshap_proxy = excluded.payshap_proxy,
        updated_at    = now();
  return new;
end;
$$;

drop trigger if exists practitioner_profiles_mirror_payout on public.practitioner_profiles;
create trigger practitioner_profiles_mirror_payout
  after insert or update of payshap_proxy
  on public.practitioner_profiles
  for each row execute function public.mirror_practitioner_payout();

-- ============================================ counterparty contact for the API
-- PARTY_SELECT in apps/api/src/modules/bookings.ts embeds profiles.phone for
-- both sides of a booking. Once phone leaves profiles that embed is gone, so
-- give the API one membership-checked call instead.

create or replace function public.booking_counterparty_contact(p_booking_id uuid)
returns table (user_id uuid, full_name text, avatar_url text, phone text)
language plpgsql
stable
security definer
set search_path to 'public'
as $$
declare
  caller uuid := auth.uid();
  b      record;
  other  uuid;
begin
  select client_id, practitioner_id into b
    from public.bookings where id = p_booking_id;
  if b is null then return; end if;

  if caller = b.client_id then
    other := b.practitioner_id;
  elsif caller = b.practitioner_id then
    other := b.client_id;
  elsif public.is_admin() then
    other := b.practitioner_id;
  else
    return; -- not a party: no rows
  end if;

  return query
  select p.id, p.full_name, p.avatar_url, pc.phone
    from public.profiles p
    left join public.profile_contact pc on pc.user_id = p.id
   where p.id = other;
end;
$$;

revoke all on function public.booking_counterparty_contact(uuid) from public, anon;
grant execute on function public.booking_counterparty_contact(uuid) to authenticated;

commit;
