import { Body, Controller, Get, Module, Param, Post } from '@nestjs/common';

import {
  zCreateRequest,
  type CreateRequestInput,
  type OfferWithProvider,
  type RequestWithOffers,
} from '@smomo/shared';
import { CurrentUser, Db, RequireRegistered, type RequestUser } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('requests')
class RequestsController {
  @RequireRegistered()
  @Post()
  async create(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zCreateRequest)) input: CreateRequestInput,
  ): Promise<{ id: string }> {
    const { data, error } = await db.rpc('create_request', {
      p_category: input.category,
      p_booking_mode: input.bookingMode,
      p_lat: input.lat,
      p_lng: input.lng,
      p_description: input.description,
      p_address: input.address,
      p_scheduled_at: input.scheduledAt ?? undefined,
      p_budget_min: input.budgetMin ?? undefined,
      p_budget_max: input.budgetMax ?? undefined,
      p_image_url: input.imageUrl ?? undefined,
      p_target: input.targetPractitionerId ?? undefined,
      p_consent: input.consent,
      p_expires_minutes: input.expiresMinutes,
    });
    if (error) throw error;
    return { id: data as string };
  }

  @Get('mine')
  async mine(@Db() db: SupaClient) {
    const { data, error } = await db
      .from('booking_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  @Get(':id')
  async get(@Db() db: SupaClient, @Param('id') id: string): Promise<RequestWithOffers> {
    const [reqRes, offersRes] = await Promise.all([
      db.from('booking_requests').select('*').eq('id', id).maybeSingle(),
      db
        .from('request_offers')
        .select('*, provider:profiles!request_offers_practitioner_id_fkey(id, full_name, avatar_url)')
        .eq('request_id', id)
        .order('offered_price_zar', { ascending: true }),
    ]);
    if (reqRes.error) throw reqRes.error;
    if (offersRes.error) throw offersRes.error;

    const offers = (offersRes.data ?? []) as any[];
    const ids = offers.map((o) => o.practitioner_id);
    let ppMap: Record<string, any> = {};
    if (ids.length) {
      const { data: pps } = await db
        .from('practitioner_profiles')
        .select('id, business_name, rating, rating_count, jobs_done, verification_status')
        .in('id', ids);
      ppMap = Object.fromEntries((pps ?? []).map((p) => [p.id, p]));
    }
    const merged = offers.map((o) => ({
      ...o,
      practitioner: ppMap[o.practitioner_id] ?? null,
    })) as unknown as OfferWithProvider[];

    return { request: reqRes.data ?? null, offers: merged };
  }

  @RequireRegistered()
  @Post(':id/cancel')
  async cancel(@Db() db: SupaClient, @Param('id') id: string, @CurrentUser() user: RequestUser) {
    const { error } = await db
      .from('booking_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('client_id', user.id);
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [RequestsController] })
export class RequestsModule {}
