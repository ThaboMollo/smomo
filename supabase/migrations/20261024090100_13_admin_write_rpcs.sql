-- 13. Admin write paths as SECURITY DEFINER RPCs.
--
-- Migration 12 revoked the columns apps/api/src/modules/admin.ts was writing directly
-- (reports.status/resolution/resolved_by and payments.status/verified_at/verified_by).
-- Those two actions move here.
--
-- Two things change beyond the mechanics:
--   * is_admin() is now re-checked IN THE DATABASE. ensureAdmin() in the API stays as a
--     fast pre-check, but it is no longer the boundary — the boundary is here.
--   * "0 rows matched" becomes an error instead of a silent success, so the API can tell
--     "resolved" from "that id doesn't exist" (see spec RC-4). P0002 is our not-found
--     convention; the Nest exception filter in Phase 4 maps it to HTTP 404, and P0001
--     (raise_exception, the Postgres default) to 422.

begin;

-- =========================================================== resolve_report
create or replace function public.resolve_report(
  p_report_id  uuid,
  p_status     public.report_status,
  p_resolution text default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'P0001';
  end if;

  update public.reports
     set status      = p_status,
         resolution  = p_resolution,
         resolved_by = auth.uid()
   where id = p_report_id;

  if not found then
    raise exception 'report not found' using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.resolve_report(uuid, public.report_status, text) is
  'Admin-only: close a report and record who actioned it. Raises P0001 for non-admins, P0002 if the report does not exist.';

revoke all on function public.resolve_report(uuid, public.report_status, text)
  from public, anon;
grant execute on function public.resolve_report(uuid, public.report_status, text)
  to authenticated;

-- ========================================================== resolve_dispute
create or replace function public.resolve_dispute(
  p_payment_id uuid,
  p_resolve_as public.payment_status
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = 'P0001';
  end if;

  update public.payments
     set status      = p_resolve_as,
         verified_at = now(),
         verified_by = auth.uid()
   where id = p_payment_id;

  if not found then
    raise exception 'payment not found' using errcode = 'P0002';
  end if;
end;
$$;

comment on function public.resolve_dispute(uuid, public.payment_status) is
  'Admin-only: settle a disputed payment. Raises P0001 for non-admins, P0002 if the payment does not exist.';

revoke all on function public.resolve_dispute(uuid, public.payment_status)
  from public, anon;
grant execute on function public.resolve_dispute(uuid, public.payment_status)
  to authenticated;

commit;
