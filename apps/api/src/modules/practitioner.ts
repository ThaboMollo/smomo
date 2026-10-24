import { Body, Controller, Delete, Get, Module, Param, Post, Put } from '@nestjs/common';
import { z } from 'zod';

import {
  zAddPortfolioItem,
  zSaveBusinessProfile,
  zSaveService,
  zSetLocation,
  type AddPortfolioItemInput,
  type FeedRequest,
  type SaveBusinessProfileInput,
  type SaveServiceInput,
  type SetLocationInput,
} from '@smomo/shared';
import { CurrentUser, Db, RequireRegistered, type RequestUser } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

const zFinalize = z.object({
  payshapProxy: z.string().min(6).max(20),
  lat: z.number(),
  lng: z.number(),
  address: z.string().max(300).nullable().optional(),
});
const zOnline = z.object({ isOnline: z.boolean() });
const zPayshap = z.object({ payshapProxy: z.string().min(6).max(20) });

@RequireRegistered()
@Controller('practitioner')
class PractitionerController {
  @Get('feed')
  async feed(@Db() db: SupaClient): Promise<FeedRequest[]> {
    const { data, error } = await db.rpc('feed_requests_for_practitioner', {});
    if (error) throw error;
    return (data ?? []) as unknown as FeedRequest[];
  }

  /**
   * One transaction via save_business_profile() (migration 05b). It writes
   * practitioner_profiles, practitioner_categories and practitioner_socials
   * together and flips profiles.is_practitioner — previously three separate
   * PostgREST calls that could half-apply.
   */
  @Put('profile')
  async saveProfile(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zSaveBusinessProfile)) input: SaveBusinessProfileInput,
  ) {
    const { error } = await db.rpc('save_business_profile', {
      p_business_name: input.businessName,
      p_bio: input.bio,
      p_categories: input.categories,
      p_years_experience: input.yearsExperience ?? undefined,
      p_service_mode: input.serviceMode,
      p_travel_radius_km: input.travelRadiusKm,
      p_requires_deposit: input.requiresDeposit,
      p_deposit_percentage: input.depositPercentage ?? undefined,
      p_instagram: input.instagram ?? undefined,
      p_facebook: input.facebook ?? undefined,
      p_tiktok: input.tiktok ?? undefined,
      p_x_handle: input.xHandle ?? undefined,
    });
    if (error) throw error;
    return { ok: true };
  }

  @Post('location')
  async setLocation(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zSetLocation)) input: SetLocationInput,
  ) {
    const { error } = await db.rpc('set_practitioner_location', {
      p_lat: input.lat,
      p_lng: input.lng,
      p_address: input.address ?? undefined,
    });
    if (error) throw error;
    return { ok: true };
  }

  /** Payout details live in practitioner_payout (migration 04), not on the public profile. */
  @Post('payshap')
  async setPayshap(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zPayshap)) input: { payshapProxy: string },
  ) {
    const { error } = await db.rpc('set_practitioner_payout', {
      p_payshap_proxy: input.payshapProxy,
    });
    if (error) throw error;
    return { ok: true };
  }

  @Post('online')
  async toggleOnline(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zOnline)) input: { isOnline: boolean },
  ) {
    const { error } = await db
      .from('practitioner_profiles')
      .update({ is_online: input.isOnline })
      .eq('id', user.id);
    if (error) throw error;
    return { ok: true };
  }

  @Post('finalize')
  async finalize(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zFinalize)) input: z.infer<typeof zFinalize>,
  ) {
    await db.from('profiles').update({ is_practitioner: true }).eq('id', user.id);
    // The practitioner_profiles row must exist before payout can reference it.
    // ignoreDuplicates emits ON CONFLICT DO NOTHING; a bare upsert would emit
    // DO UPDATE SET id = excluded.id, which needs UPDATE(id) — revoked in migration 12.
    const { error: ppErr } = await db
      .from('practitioner_profiles')
      .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true });
    if (ppErr) throw ppErr;
    const { error: payErr } = await db.rpc('set_practitioner_payout', {
      p_payshap_proxy: input.payshapProxy,
    });
    if (payErr) throw payErr;
    const { error: locErr } = await db.rpc('set_practitioner_location', {
      p_lat: input.lat,
      p_lng: input.lng,
      p_address: input.address ?? undefined,
    });
    if (locErr) throw locErr;
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 30);
    await db
      .from('subscriptions')
      .upsert(
        { practitioner_id: user.id, plan: 'launch_trial', status: 'trialing', trial_ends_at: trialEnds.toISOString() },
        { onConflict: 'practitioner_id', ignoreDuplicates: true },
      );
    return { ok: true };
  }

  @Get(':id/services')
  async services(@Db() db: SupaClient, @Param('id') id: string) {
    const { data, error } = await db
      .from('services')
      .select('*')
      .eq('practitioner_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  @Post('services')
  async saveService(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zSaveService)) input: SaveServiceInput,
  ) {
    const row = {
      practitioner_id: user.id,
      category: input.category,
      title: input.title,
      description: input.description,
      indicative_price_zar: input.indicativePrice ?? null,
      duration_minutes: input.durationMinutes ?? null,
    };
    const { error } = input.id
      ? await db.from('services').update(row).eq('id', input.id)
      : await db.from('services').insert(row);
    if (error) throw error;
    return { ok: true };
  }

  @Delete('services/:id')
  async deleteService(@Db() db: SupaClient, @Param('id') id: string) {
    const { error } = await db.from('services').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  }

  @Get(':id/portfolio')
  async portfolio(@Db() db: SupaClient, @Param('id') id: string) {
    const { data, error } = await db
      .from('portfolio_items')
      .select('*')
      .eq('practitioner_id', id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  @Post('portfolio')
  async addPortfolio(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zAddPortfolioItem)) input: AddPortfolioItemInput,
  ) {
    const { error } = await db.from('portfolio_items').insert({
      practitioner_id: user.id,
      image_url: input.imageUrl,
      caption: input.caption,
      category: input.category ?? null,
      source: 'manual',
      is_public: true,
    });
    if (error) throw error;
    return { ok: true };
  }

  @Delete('portfolio/:id')
  async deletePortfolio(@Db() db: SupaClient, @Param('id') id: string) {
    const { error } = await db.from('portfolio_items').delete().eq('id', id);
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [PractitionerController] })
export class PractitionerModule {}
