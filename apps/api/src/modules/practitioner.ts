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

  @Put('profile')
  async saveProfile(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zSaveBusinessProfile)) input: SaveBusinessProfileInput,
  ) {
    const { error } = await db.from('practitioner_profiles').upsert({
      id: user.id,
      business_name: input.businessName,
      bio: input.bio,
      categories: input.categories,
      years_experience: input.yearsExperience ?? null,
      service_mode: input.serviceMode,
      travel_radius_km: input.travelRadiusKm,
      requires_deposit: input.requiresDeposit,
      deposit_percentage: input.requiresDeposit ? (input.depositPercentage ?? 0) : null,
    });
    if (error) throw error;
    await db.from('profiles').update({ is_practitioner: true }).eq('id', user.id);
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

  @Post('payshap')
  async setPayshap(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zPayshap)) input: { payshapProxy: string },
  ) {
    const { error } = await db
      .from('practitioner_profiles')
      .update({ payshap_proxy: input.payshapProxy })
      .eq('id', user.id);
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
    const { error: ppErr } = await db
      .from('practitioner_profiles')
      .upsert({ id: user.id, payshap_proxy: input.payshapProxy });
    if (ppErr) throw ppErr;
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
