import { Controller, Get, Module, NotFoundException, Param, Query } from '@nestjs/common';

import {
  zPagination,
  type Enums,
  type Paginated,
  type PublicProvider,
  type PublicProviderListItem,
} from '@smomo/shared';
import { Db, Public } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

const SLUG_TO_CATEGORY: Record<string, Enums<'service_category'>> = {
  'tattoo-artists': 'tattoo_artist',
  hairdressers: 'hairdresser',
  'nail-technicians': 'nail_technician',
  'makeup-artists': 'makeup_artist',
  beauticians: 'beautician',
};

function cityFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ').trim();
}

const LIST_SELECT =
  'id, slug, business_name, categories, rating, rating_count, jobs_done, profile:profiles!practitioner_profiles_id_fkey(avatar_url)';

function toListItem(row: any): PublicProviderListItem {
  return {
    id: row.id,
    slug: row.slug,
    business_name: row.business_name,
    categories: row.categories,
    rating: row.rating,
    rating_count: row.rating_count,
    jobs_done: row.jobs_done,
    avatar_url: row.profile?.avatar_url ?? null,
    min_price: null,
  };
}

@Public()
@Controller('public')
class PublicController {
  @Get('providers/:slug')
  async provider(@Db() db: SupaClient, @Param('slug') slug: string): Promise<PublicProvider> {
    const { data: pp } = await db
      .from('practitioner_profiles')
      .select('*, profile:profiles!practitioner_profiles_id_fkey(full_name, avatar_url)')
      .eq('slug', slug)
      .maybeSingle();
    if (!pp) throw new NotFoundException('Provider not found');

    const [svc, pf, rv] = await Promise.all([
      db
        .from('services')
        .select('id, category, title, description, indicative_price_zar')
        .eq('practitioner_id', pp.id)
        .eq('is_active', true),
      db
        .from('portfolio_items')
        .select('id, image_url, caption, category')
        .eq('practitioner_id', pp.id)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(24),
      db
        .from('reviews')
        .select('rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(full_name)')
        .eq('reviewee_id', pp.id)
        .eq('direction', 'c2p')
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const anyPp = pp as any;
    return {
      id: pp.id,
      slug: anyPp.slug,
      business_name: pp.business_name,
      bio: pp.bio,
      categories: pp.categories,
      service_mode: pp.service_mode,
      rating: pp.rating,
      rating_count: pp.rating_count,
      jobs_done: pp.jobs_done,
      base_address: pp.base_address,
      avatar_url: anyPp.profile?.avatar_url ?? null,
      services: (svc.data ?? []) as PublicProvider['services'],
      portfolio: (pf.data ?? []) as PublicProvider['portfolio'],
      reviews: (rv.data ?? []).map((r: any) => ({
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        reviewer_name: r.reviewer?.full_name ?? null,
      })),
    };
  }

  @Get('city/:city')
  async cityHub(
    @Db() db: SupaClient,
    @Param('city') city: string,
    @Query(new ZodValidationPipe(zPagination)) page: { limit: number; offset: number },
  ): Promise<Paginated<PublicProviderListItem>> {
    const { data, count } = await db
      .from('practitioner_profiles')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('verification_status', 'verified')
      .ilike('base_address', `%${cityFromSlug(city)}%`)
      .order('rating', { ascending: false, nullsFirst: false })
      .range(page.offset, page.offset + page.limit - 1);
    return { items: (data ?? []).map(toListItem), total: count ?? 0, limit: page.limit, offset: page.offset };
  }

  @Get(':category/:city')
  async listing(
    @Db() db: SupaClient,
    @Param('category') category: string,
    @Param('city') city: string,
    @Query(new ZodValidationPipe(zPagination)) page: { limit: number; offset: number },
  ): Promise<Paginated<PublicProviderListItem>> {
    const cat = SLUG_TO_CATEGORY[category];
    if (!cat) throw new NotFoundException('Unknown category');
    const { data, count } = await db
      .from('practitioner_profiles')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('verification_status', 'verified')
      .contains('categories', [cat])
      .ilike('base_address', `%${cityFromSlug(city)}%`)
      .order('rating', { ascending: false, nullsFirst: false })
      .range(page.offset, page.offset + page.limit - 1);
    return { items: (data ?? []).map(toListItem), total: count ?? 0, limit: page.limit, offset: page.offset };
  }

  @Get(':category')
  async categoryHub(
    @Db() db: SupaClient,
    @Param('category') category: string,
    @Query(new ZodValidationPipe(zPagination)) page: { limit: number; offset: number },
  ): Promise<Paginated<PublicProviderListItem>> {
    const cat = SLUG_TO_CATEGORY[category];
    if (!cat) throw new NotFoundException('Unknown category');
    const { data, count } = await db
      .from('practitioner_profiles')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('verification_status', 'verified')
      .contains('categories', [cat])
      .order('rating', { ascending: false, nullsFirst: false })
      .range(page.offset, page.offset + page.limit - 1);
    return { items: (data ?? []).map(toListItem), total: count ?? 0, limit: page.limit, offset: page.offset };
  }
}

@Module({ controllers: [PublicController] })
export class PublicModule {}
