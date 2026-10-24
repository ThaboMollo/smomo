-- 18. Verifying a practitioner becomes an action the product can take.
--
-- Until now `practitioner_profiles.verification_status` was written by nothing. The API,
-- the web app and the mobile app only ever read it — all 16 call sites — and migration 12
-- revoked `authenticated`'s UPDATE on the column. Column privileges are checked before
-- RLS, so even an admin whose session satisfies `pp_update_own` (`auth.uid() = id OR
-- is_admin()`) could not change it from the client. The only way to verify a pro was the
-- SQL editor with the service role.
--
-- That matters more than it sounds: `make_offer` refuses an unverified practitioner and
-- `feed_requests_for_practitioner` returns them nothing, so an unverified pro cannot work
-- at all. Admitting someone to the marketplace was an untracked manual database edit.
--
-- This adds the write path, following the shape migration 13 established for reports and
-- payments: a SECURITY DEFINER function that re-checks `is_admin()` IN THE DATABASE, so
-- the console's role gate is a convenience and this is the boundary. P0001 for "not an
-- admin", P0002 for "no such practitioner" — the convention the Nest exception filter maps
-- to 422 and 404, so "verified" can never be confused with "that id doesn't exist".
--
-- It also maintains `verified_at`, a column that already existed on
-- `practitioner_profiles` and was written by nothing — 4 of 12 rows had it null while
-- being verified. From here it is stamped on approval and cleared on anything else.
--
-- Also tidied here: `anon` still held INSERT/UPDATE column grants on
-- `verification_status`. Not exploitable — `pp_update_own` requires a matching `auth.uid()`
-- or `is_admin()`, and an anonymous caller satisfies neither — but it contradicts what
-- migration 12 set out to do and there is no reason for it to stay.

begin;

-- ── The audit trail. Who admitted whom, when, and why.
create table if not exists public.practitioner_verification_events (
  id              uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references public.practitioner_profiles(id) on delete cascade,
  from_status     public.verification_status not null,
  to_status       public.verification_status not null,
  note            text,
  decided_by      uuid not null references public.profiles(id),
  created_at      timestamptz not null default now()
);

create index if not exists pve_practitioner_idx
  on public.practitioner_verification_events (practitioner_id, created_at desc);

comment on table public.practitioner_verification_events is
  'Append-only record of every verification decision. Written by set_practitioner_verification().';

alter table public.practitioner_verification_events enable row level security;

-- Staff read the whole log; a practitioner reads their own decisions so the console can
-- tell them WHY they were rejected. Nobody writes directly — the RPC owns that.
create policy pve_select_staff_or_self on public.practitioner_verification_events
  for select
  using (public.is_admin() or auth.uid() = practitioner_id);

revoke all on table public.practitioner_verification_events from anon;
grant select on table public.practitioner_verification_events to authenticated;

-- ── The write path.
create or replace function public.set_practitioner_verification(
  p_practitioner_id uuid,
  p_status          public.verification_status,
  p_note            text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller  uuid := auth.uid();
  current public.verification_status;
begin
  if caller is null or not public.is_admin() then
    raise exception 'admin only' using errcode = 'P0001';
  end if;

  select verification_status into current
    from public.practitioner_profiles
   where id = p_practitioner_id
   for update;

  if current is null then
    raise exception 'practitioner not found' using errcode = 'P0002';
  end if;

  -- A rejection has to say why: it is the one outcome the person has to act on, and the
  -- console shows this note back to them.
  if p_status = 'rejected' and coalesce(btrim(p_note), '') = '' then
    raise exception 'a rejection needs a reason' using errcode = 'P0001';
  end if;

  -- Re-deciding the same status is a no-op rather than a second log entry, so a
  -- double-clicked button does not read as two decisions.
  if current = p_status then
    return;
  end if;

  -- `verified_at` already exists on the table and was never maintained by anything.
  -- Stamp it when the status becomes 'verified' and clear it otherwise, so it always
  -- answers "when was this account admitted" rather than being half-populated.
  update public.practitioner_profiles
     set verification_status = p_status,
         verified_at = case when p_status = 'verified' then now() else null end
   where id = p_practitioner_id;

  insert into public.practitioner_verification_events
    (practitioner_id, from_status, to_status, note, decided_by)
  values
    (p_practitioner_id, current, p_status, nullif(btrim(p_note), ''), caller);
end;
$$;

comment on function public.set_practitioner_verification(uuid, public.verification_status, text) is
  'Admin-only: set a practitioner''s verification status and log the decision. P0001 for non-admins or a rejection with no reason, P0002 if the practitioner does not exist.';

revoke all on function public.set_practitioner_verification(uuid, public.verification_status, text)
  from public, anon;
grant execute on function public.set_practitioner_verification(uuid, public.verification_status, text)
  to authenticated, service_role;

-- ── Close the stray anon grants migration 12 left behind.
revoke insert (verification_status), update (verification_status)
  on public.practitioner_profiles from anon;

commit;
