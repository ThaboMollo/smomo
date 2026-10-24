'use server';

import { revalidatePath } from 'next/cache';

import { CATEGORIES, type ServiceCategory, type ServiceMode } from '@smomo/shared';

import { requireUser } from '@/lib/session';
import { createClient } from '@/lib/supabase/server';

export type ActionResult = { ok: true } | { ok: false; error: string };

const VALID_CATEGORIES = new Set(CATEGORIES.map((c) => c.value));
const VALID_MODES: ServiceMode[] = ['studio', 'mobile', 'both'];

/**
 * Save the business profile.
 *
 * One call to `save_business_profile`, which writes `practitioner_profiles`,
 * `practitioner_categories` and `practitioner_socials` in a single transaction (migration
 * 05b) — the three used to be separate PostgREST calls that could half-apply.
 *
 * Every nullable argument is sent as an explicit null, never omitted: PostgREST resolves
 * an overload by the exact set of argument names, and an omitted key is what caused the
 * live 500 that migration 15 fixed.
 */
export async function saveStudio(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.isPractitioner) return { ok: false, error: 'Only professionals have a studio.' };

  const businessName = String(formData.get('businessName') ?? '').trim();
  const bio = String(formData.get('bio') ?? '').trim();
  const categories = formData.getAll('categories').map(String).filter((c) => VALID_CATEGORIES.has(c as ServiceCategory));
  const serviceMode = String(formData.get('serviceMode') ?? '') as ServiceMode;
  const travelRadiusKm = Number(formData.get('travelRadiusKm') ?? NaN);
  const yearsRaw = String(formData.get('yearsExperience') ?? '').trim();
  const requiresDeposit = formData.get('requiresDeposit') === 'on';
  const depositRaw = String(formData.get('depositPercentage') ?? '').trim();

  if (businessName.length < 2) return { ok: false, error: 'Enter a business name of at least 2 characters.' };
  if (categories.length === 0) return { ok: false, error: 'Pick at least one service category.' };
  if (!VALID_MODES.includes(serviceMode)) return { ok: false, error: 'Choose how you work.' };
  if (!Number.isFinite(travelRadiusKm) || travelRadiusKm <= 0 || travelRadiusKm > 200) {
    return { ok: false, error: 'Travel radius must be between 1 and 200 km.' };
  }

  const depositPercentage = depositRaw ? Number(depositRaw) : null;
  if (requiresDeposit && (depositPercentage == null || depositPercentage < 1 || depositPercentage > 100)) {
    // The DB's practitioner_profiles_deposit_coherent CHECK enforces this too.
    return { ok: false, error: 'Set a deposit percentage between 1 and 100, or turn deposits off.' };
  }

  const handle = (name: string) => {
    const v = String(formData.get(name) ?? '').trim().replace(/^@+/, '');
    return v || null;
  };

  const supabase = await createClient();
  const { error } = await supabase.rpc('save_business_profile', {
    p_business_name: businessName,
    p_categories: categories as ServiceCategory[],
    p_service_mode: serviceMode,
    p_travel_radius_km: travelRadiusKm,
    p_requires_deposit: requiresDeposit,
    p_bio: bio || null,
    p_years_experience: yearsRaw ? Number(yearsRaw) : null,
    p_deposit_percentage: requiresDeposit ? depositPercentage : null,
    p_instagram: handle('instagram'),
    p_facebook: handle('facebook'),
    p_tiktok: handle('tiktok'),
    p_x_handle: handle('xHandle'),
  });
  if (error) {
    if (error.code === 'P0001') return { ok: false, error: error.message };
    return { ok: false, error: 'Could not save your studio. Try again.' };
  }

  revalidatePath('/studio');
  revalidatePath('/');
  return { ok: true };
}

/**
 * Where the pro is based. Coordinates are optional since migration 16 — with geolocation
 * parked the base is a typed address and the city is what clients match against.
 */
export async function saveBase(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  if (!user.isPractitioner) return { ok: false, error: 'Only professionals have a base.' };

  const address = String(formData.get('baseAddress') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  if (!city) return { ok: false, error: 'Add the city so clients nearby can find you.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('set_practitioner_location', {
    p_lat: null,
    p_lng: null,
    p_address: address || null,
    p_city: city,
  });
  if (error) return { ok: false, error: 'Could not save your base. Try again.' };

  revalidatePath('/studio');
  return { ok: true };
}

/** Going offline stops new requests reaching them without touching anything else. */
export async function setOnline(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const online = formData.get('isOnline') === 'true';

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('practitioner_profiles')
    .update({ is_online: online })
    .eq('id', user.id)
    .select('id');

  if (error) return { ok: false, error: 'Could not change your status.' };
  if (!data?.length) return { ok: false, error: 'No studio found for your account.' };

  revalidatePath('/studio');
  revalidatePath('/offers');
  return { ok: true };
}
