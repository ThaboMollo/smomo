'use server';

import { revalidatePath } from 'next/cache';

import { requireStaff } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

/**
 * Approve or reject a practitioner.
 *
 * Calls `set_practitioner_verification` (migration 18), which re-checks `is_admin()` in
 * the database — so this action's own `requireStaff()` is a fast failure, not the
 * boundary. The RPC also writes the decision to `practitioner_verification_events`, so
 * every approval has an author and a timestamp.
 *
 * Error codes come from the RPC's own conventions: P0001 for a refused decision (not an
 * admin, or a rejection with no reason), P0002 for an id that does not exist. They are
 * translated here rather than shown raw.
 */
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function decideVerification(formData: FormData): Promise<ActionResult> {
  await requireStaff();

  const practitionerId = String(formData.get('practitionerId') ?? '');
  const status = String(formData.get('status') ?? '');
  const note = String(formData.get('note') ?? '').trim();

  if (!practitionerId) return { ok: false, error: 'No practitioner was selected.' };
  if (status !== 'verified' && status !== 'rejected' && status !== 'pending') {
    return { ok: false, error: 'Unknown decision.' };
  }
  if (status === 'rejected' && !note) {
    // The database enforces this too; saying it here avoids a round trip.
    return { ok: false, error: 'A rejection needs a reason — the pro is shown this note.' };
  }

  const supabase = await createClient();

  // `set_practitioner_verification` arrives with migration 18. The RPC re-checks
  // `is_admin()` itself, so the `requireStaff()` above is a fast failure, not the gate.
  const { error } = await supabase.rpc('set_practitioner_verification', {
    p_practitioner_id: practitionerId,
    p_status: status,
    p_note: note || null,
  });

  if (error) {
    if (error.code === 'P0002') return { ok: false, error: 'That practitioner no longer exists.' };
    if (error.code === 'P0001') return { ok: false, error: error.message };
    return { ok: false, error: 'Could not save that decision. Try again.' };
  }

  revalidatePath('/platform/verification');
  revalidatePath('/platform');
  revalidatePath('/');
  return { ok: true };
}
