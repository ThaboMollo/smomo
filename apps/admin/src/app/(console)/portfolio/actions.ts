'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Show or hide one portfolio item.
 *
 * `is_public` is the pro's own control, but it is not the only gate: a photo captured from
 * a completed job also needs the client's portfolio consent, recorded on the booking.
 * Hiding is therefore always permitted; showing is only meaningful where consent exists,
 * which the page makes clear per item rather than silently failing here.
 */
export async function setItemPublic(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  const isPublic = formData.get('isPublic') === 'true';
  if (!id) return { ok: false, error: 'No photo was selected.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({ is_public: isPublic })
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not change that photo.' };
  if (!data?.length) return { ok: false, error: 'That photo no longer exists.' };

  revalidatePath('/portfolio');
  return { ok: true };
}

/**
 * Remove a portfolio item.
 *
 * Deletes the row only. The file stays in Storage: proof-of-work images are referenced by
 * `reviews.proof_image_url` as well, and deleting the object would break a review a client
 * can still see. Reclaiming orphaned files is a separate sweep, not this action's job.
 */
export async function deleteItem(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'No photo was selected.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_items')
    .delete()
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not remove that photo.' };
  if (!data?.length) return { ok: false, error: 'That photo no longer exists.' };

  revalidatePath('/portfolio');
  return { ok: true };
}

export async function setCaption(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  const caption = String(formData.get('caption') ?? '').trim();
  if (!id) return { ok: false, error: 'No photo was selected.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('portfolio_items')
    .update({ caption: caption || null })
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not save that caption.' };
  if (!data?.length) return { ok: false, error: 'That photo no longer exists.' };

  revalidatePath('/portfolio');
  return { ok: true };
}
