import { Body, Controller, Get, Module, Patch, Post } from '@nestjs/common';

import {
  zSubmitIdentity,
  zUpdateProfile,
  type SubmitIdentityInput,
  type UpdateProfileInput,
} from '@smomo/shared';
import { CurrentUser, Db, RequireRegistered, type RequestUser } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('me')
class MeController {
  @Get()
  async get(@Db() db: SupaClient, @CurrentUser() user: RequestUser) {
    // profile_contact / practitioner_payout are row-secured to self, so these
    // only ever return the caller's own details.
    const [prof, contact] = await Promise.all([
      db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      db
        .from('profile_contact')
        .select('phone, whatsapp_number, home_address')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);
    const profile = prof.data;

    let practitioner: any = null;
    let subscription: any = null;
    if (profile?.is_practitioner) {
      const [pp, sub, payout, cats, socials] = await Promise.all([
        db.from('practitioner_profiles').select('*').eq('id', user.id).maybeSingle(),
        db.from('subscriptions').select('*').eq('practitioner_id', user.id).maybeSingle(),
        db
          .from('practitioner_payout')
          .select('payshap_proxy')
          .eq('practitioner_id', user.id)
          .maybeSingle(),
        db.from('practitioner_categories').select('category').eq('practitioner_id', user.id),
        db.from('practitioner_socials').select('platform, handle').eq('practitioner_id', user.id),
      ]);

      // categories and the social handles are re-flattened onto the practitioner
      // object so the studio edit forms keep prefilling from the same keys after
      // migration 08 drops the legacy columns.
      const handles = Object.fromEntries(
        (socials.data ?? []).map((s) => [s.platform, s.handle]),
      ) as Partial<Record<'instagram' | 'facebook' | 'tiktok' | 'x', string>>;

      practitioner = pp.data
        ? {
            ...pp.data,
            payshap_proxy: payout.data?.payshap_proxy ?? null,
            categories: (cats.data ?? []).map((c) => c.category),
            instagram: handles.instagram ?? null,
            facebook: handles.facebook ?? null,
            tiktok: handles.tiktok ?? null,
            x_handle: handles.x ?? null,
          }
        : null;
      subscription = sub.data ?? null;
    }

    // Kept flat on `profile` so existing screens keep reading profile.phone etc.
    const merged = profile
      ? {
          ...profile,
          phone: contact.data?.phone ?? null,
          whatsapp_number: contact.data?.whatsapp_number ?? null,
          home_address: contact.data?.home_address ?? null,
        }
      : null;

    return { profile: merged, practitioner, subscription };
  }

  /**
   * Splits the payload across the two tables: identity/display fields stay on
   * profiles, contact details go to profile_contact via set_profile_contact()
   * (migrations 04/05b). profiles.full_name is derived from first/last by the
   * profiles_derive_full_name trigger (migration 06), so it is not written here.
   */
  @RequireRegistered()
  @Patch()
  async update(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zUpdateProfile)) input: UpdateProfileInput,
  ) {
    const { phone, whatsapp_number, home_address, ...profileFields } = input;

    if (Object.keys(profileFields).length > 0) {
      const { error } = await db.from('profiles').update(profileFields).eq('id', user.id);
      if (error) throw error;
    }

    if (phone !== undefined || whatsapp_number !== undefined || home_address !== undefined) {
      const { error } = await db.rpc('set_profile_contact', {
        p_phone: phone ?? undefined,
        p_whatsapp_number: whatsapp_number ?? undefined,
        p_home_address: home_address ?? undefined,
      });
      if (error) throw error;
    }

    return { ok: true };
  }

  @RequireRegistered()
  @Post('identity')
  async identity(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zSubmitIdentity)) input: SubmitIdentityInput,
  ) {
    const { error } = await db.from('user_identity').upsert({
      user_id: user.id,
      id_type: input.idType,
      id_number: input.idNumber,
      id_country: input.idCountry ?? (input.idType === 'sa_id' ? 'South Africa' : null),
    });
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [MeController] })
export class MeModule {}
