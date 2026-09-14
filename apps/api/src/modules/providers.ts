import { Controller, Get, Module, Param, Query } from '@nestjs/common';

import {
  zSearchProvidersQuery,
  type ProviderCard,
  type ProviderDetail,
  type SearchProvidersQuery,
} from '@smomo/shared';
import { Db } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@Controller('providers')
class ProvidersController {
  @Get('search')
  async search(
    @Db() db: SupaClient,
    @Query(new ZodValidationPipe(zSearchProvidersQuery)) q: SearchProvidersQuery,
  ): Promise<ProviderCard[]> {
    const { data, error } = await db.rpc('search_providers', {
      p_lat: q.lat,
      p_lng: q.lng,
      p_category: q.category,
      p_mode: q.mode,
      p_max_km: q.maxKm,
    });
    if (error) throw error;
    return (data ?? []) as unknown as ProviderCard[];
  }

  @Get(':id')
  async get(@Db() db: SupaClient, @Param('id') id: string): Promise<ProviderDetail | null> {
    const [prof, pp, svc, pf, rv] = await Promise.all([
      db.from('profiles').select('*').eq('id', id).maybeSingle(),
      db.from('practitioner_profiles').select('*').eq('id', id).maybeSingle(),
      db.from('services').select('*').eq('practitioner_id', id).eq('is_active', true),
      db
        .from('portfolio_items')
        .select('*')
        .eq('practitioner_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: false }),
      db
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
        .eq('reviewee_id', id)
        .eq('direction', 'c2p')
        .order('created_at', { ascending: false }),
    ]);
    if (!prof.data || !pp.data) return null;
    return {
      profile: prof.data,
      practitioner: pp.data,
      services: svc.data ?? [],
      portfolio: pf.data ?? [],
      reviews: (rv.data ?? []) as unknown as ProviderDetail['reviews'],
    };
  }
}

@Module({ controllers: [ProvidersController] })
export class ProvidersModule {}
