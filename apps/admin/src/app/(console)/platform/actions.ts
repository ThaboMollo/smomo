'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

/**
 * Staff moderation actions.
 *
 * Both go through the SECURITY DEFINER RPCs migration 13 added, which re-check
 * `is_admin()` in the database and raise P0002 when nothing matched — so "resolved" can
 * never be confused with "that id doesn't exist" (spec RC-4). `requireStaff()` here is the
 * fast failure, not the boundary.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

function translate(error: { code?: string; message: string }): string {
  if (error.code === 'P0002') return 'That record no longer exists — it may already be resolved.';
  if (error.code === 'P0001') return error.message;
  return 'Could not save that. Try again.';
}

export async function resolveReport(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '');
  const resolution = String(formData.get('resolution') ?? '').trim();

  if (!id) return { ok: false, error: 'No report was selected.' };
  if (status !== 'resolved' && status !== 'dismissed' && status !== 'reviewing') {
    return { ok: false, error: 'Unknown decision.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('resolve_report', {
    p_report_id: id,
    p_status: status,
    p_resolution: resolution || null,
  });
  if (error) return { ok: false, error: translate(error) };

  revalidatePath('/platform/reports');
  revalidatePath('/platform');
  revalidatePath('/');
  return { ok: true };
}

export async function resolveDispute(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const id = String(formData.get('id') ?? '');
  const resolveAs = String(formData.get('resolveAs') ?? '');

  if (!id) return { ok: false, error: 'No payment was selected.' };
  if (resolveAs !== 'verified' && resolveAs !== 'rejected') {
    return { ok: false, error: 'Unknown decision.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc('resolve_dispute', {
    p_payment_id: id,
    p_resolve_as: resolveAs,
  });
  if (error) return { ok: false, error: translate(error) };

  revalidatePath('/platform/disputes');
  revalidatePath('/platform');
  revalidatePath('/');
  return { ok: true };
}
