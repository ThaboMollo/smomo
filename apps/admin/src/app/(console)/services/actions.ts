'use server';

import { revalidatePath } from 'next/cache';

import { CATEGORIES, type ServiceCategory } from '@smomo/shared';

import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

const VALID = new Set(CATEGORIES.map((c) => c.value));

type Parsed = {
  category: ServiceCategory;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  priceZar: number | null;
};

/** Shared validation, so create and update cannot drift apart. */
function parse(formData: FormData): Parsed | string {
  const category = String(formData.get('category') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const durationRaw = String(formData.get('durationMinutes') ?? '').trim();
  const priceRaw = String(formData.get('priceZar') ?? '').trim();

  if (!VALID.has(category as ServiceCategory)) return 'Choose a category.';
  if (title.length < 2) return 'Give the service a name.';

  const durationMinutes = durationRaw ? Number(durationRaw) : null;
  if (durationMinutes != null && (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > 1440)) {
    return 'Duration must be between 1 and 1440 minutes.';
  }
  const priceZar = priceRaw ? Number(priceRaw) : null;
  if (priceZar != null && (!Number.isFinite(priceZar) || priceZar < 0)) {
    return 'Price cannot be negative.';
  }

  return { category: category as ServiceCategory, title, description: description || null, durationMinutes, priceZar };
}

export async function createService(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.isPractitioner) return { ok: false, error: 'Only professionals have services.' };

  const parsed = parse(formData);
  if (typeof parsed === 'string') return { ok: false, error: parsed };

  const supabase = await createClient();
  const { error } = await supabase.from('services').insert({
    practitioner_id: user.id,
    category: parsed.category,
    title: parsed.title,
    description: parsed.description,
    duration_minutes: parsed.durationMinutes,
    indicative_price_zar: parsed.priceZar,
    is_active: true,
  });
  if (error) return { ok: false, error: 'Could not add that service.' };

  revalidatePath('/services');
  return { ok: true };
}

export async function updateService(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'No service was selected.' };

  const parsed = parse(formData);
  if (typeof parsed === 'string') return { ok: false, error: parsed };

  const supabase = await createClient();
  // `.select()` so a zero-row update is not reported as success — PostgREST returns no
  // error either way, which is spec RC-4.
  const { data, error } = await supabase
    .from('services')
    .update({
      category: parsed.category,
      title: parsed.title,
      description: parsed.description,
      duration_minutes: parsed.durationMinutes,
      indicative_price_zar: parsed.priceZar,
    })
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not save that service.' };
  if (!data?.length) return { ok: false, error: 'That service no longer exists.' };

  revalidatePath('/services');
  return { ok: true };
}

/** Active / inactive rather than delete: an inactive service keeps its booking history. */
export async function setServiceActive(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  if (!id) return { ok: false, error: 'No service was selected.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .update({ is_active: active })
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not change that service.' };
  if (!data?.length) return { ok: false, error: 'That service no longer exists.' };

  revalidatePath('/services');
  return { ok: true };
}

export async function deleteService(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const id = String(formData.get('id') ?? '');
  if (!id) return { ok: false, error: 'No service was selected.' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)
    .eq('practitioner_id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not remove that service.' };
  if (!data?.length) return { ok: false, error: 'That service no longer exists.' };

  revalidatePath('/services');
  return { ok: true };
}
