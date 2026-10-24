'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Send an offer on an open request.
 *
 * `make_offer` does the real gatekeeping in the database: it refuses a practitioner who is
 * not verified, has no trialing/active subscription, or whose request is no longer open.
 * Those are business rules, so their messages are surfaced to the pro rather than being
 * flattened into "something went wrong" — a pro who cannot offer needs to know which of
 * the three it is.
 */
export async function sendOffer(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.isPractitioner) return { ok: false, error: 'Only professionals can send offers.' };

  const requestId = String(formData.get('requestId') ?? '');
  const price = Number(formData.get('price') ?? NaN);
  const message = String(formData.get('message') ?? '').trim();

  if (!requestId) return { ok: false, error: 'No request was selected.' };
  if (!Number.isFinite(price) || price <= 0) return { ok: false, error: 'Enter a price above zero.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('make_offer', {
    p_request_id: requestId,
    p_price: price,
    p_message: message || null,
  });

  if (error) {
    // P0001 is the convention for a refused business rule; the message is written for the
    // person (e.g. 'practitioner not verified', 'no active subscription').
    if (error.code === 'P0001') return { ok: false, error: error.message };
    return { ok: false, error: 'Could not send that offer. Try again.' };
  }

  revalidatePath('/offers');
  revalidatePath('/');
  return { ok: true };
}

/** Withdraw an offer the pro has already sent. Their own row, so RLS is the gate. */
export async function withdrawOffer(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'No offer was selected.' };

  const supabase = await createClient();
  // `.select()` so a zero-row update is distinguishable from a successful one — PostgREST
  // reports no error either way (spec RC-4).
  const { data, error } = await supabase
    .from('request_offers')
    .update({ status: 'withdrawn' })
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .eq('status', 'pending')
    .select('id');

  if (error) return { ok: false, error: 'Could not withdraw that offer.' };
  if (!data?.length) {
    return { ok: false, error: 'That offer can no longer be withdrawn — it may already be accepted.' };
  }

  revalidatePath('/offers');
  return { ok: true };
}
