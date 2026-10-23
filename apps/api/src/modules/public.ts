import { Controller, Get, Module, NotFoundException, Param, Query } from '@nestjs/common';

import {
  zPagination,
  type Enums,
  type Paginated,
  type PublicProvider,
  type PublicProviderListItem,
  type SocialHandles,
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

/**
 * Everything here reads `practitioner_directory` (migration 05) rather than
 * `practitioner_profiles` directly. The view aggregates the 4NF category and
 * social tables back into a `categories` array and a `socials` object, joins the
 * display name/avatar, and supplies `min_price` — and it cannot leak payout
 * details, because it does not select them.
 *
 * Columns are listed explicitly: `anon` holds column-level SELECT grants only
 * (migration 01), so `select('*')` would fail.
 */
const LIST_SELECT = 'id, slug, business_name, categories, rating, rating_count, jobs_done, avatar_url, min_price';

const DETAIL_SELECT =
  'id, slug, business_name, bio, categories, service_mode, rating, rating_count, jobs_done, base_address, avatar_url, socials';

/** The jsonb `socials` object -> the flat handles the public DTO exposes. */
function socialsOf(raw: unknown): SocialHandles {
  return (raw && typeof raw === 'object' ? raw : {}) as SocialHandles;
}

function toListItem(row: any): PublicProviderListItem {
  return {
    id: row.id,
    slug: row.slug,
    business_name: row.business_name,
    categories: row.categories ?? [],
    rating: row.rating,
    rating_count: row.rating_count,
    jobs_done: row.jobs_done,
    avatar_url: row.avatar_url ?? null,
    min_price: row.min_price ?? null,
  };
}

@Public()
@Controller('public')
class PublicController {
  @Get('providers/:slug')
  async provider(@Db() db: SupaClient, @Param('slug') slug: string): Promise<PublicProvider> {
    const { data: pp, error } = await db
      .from('practitioner_directory')
      .select(DETAIL_SELECT)
      .eq('slug', slug)
      .maybeSingle();
    // Check the error first, so a query failure is not reported as a 404.
    if (error) throw error;
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

    const socials = socialsOf((pp as any).socials);

    return {
      id: pp.id,
      slug: (pp as any).slug,
      business_name: pp.business_name,
      bio: pp.bio,
      categories: pp.categories ?? [],
      service_mode: pp.service_mode,
      rating: pp.rating,
      rating_count: pp.rating_count,
      jobs_done: pp.jobs_done,
      base_address: pp.base_address,
      avatar_url: (pp as any).avatar_url ?? null,
      instagram: socials.instagram ?? null,
      facebook: socials.facebook ?? null,
      tiktok: socials.tiktok ?? null,
      x_handle: socials.x ?? null,
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
    const { data, count, error } = await db
      .from('practitioner_directory')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('verification_status', 'verified')
      .ilike('base_address', `%${cityFromSlug(city)}%`)
      .order('rating', { ascending: false, nullsFirst: false })
      .range(page.offset, page.offset + page.limit - 1);
    // Without this a database failure renders as "no providers in this city"
    // rather than an error — these are the public SEO pages.
    if (error) throw error;
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
    const { data, count, error } = await db
      .from('practitioner_directory')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('verification_status', 'verified')
      .contains('categories', [cat])
      .ilike('base_address', `%${cityFromSlug(city)}%`)
      .order('rating', { ascending: false, nullsFirst: false })
      .range(page.offset, page.offset + page.limit - 1);
    // Without this a database failure renders as "no providers in this city"
    // rather than an error — these are the public SEO pages.
    if (error) throw error;
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
    const { data, count, error } = await db
      .from('practitioner_directory')
      .select(LIST_SELECT, { count: 'exact' })
      .eq('verification_status', 'verified')
      .contains('categories', [cat])
      .order('rating', { ascending: false, nullsFirst: false })
      .range(page.offset, page.offset + page.limit - 1);
    // Without this a database failure renders as "no providers in this category"
    // rather than an error — these are the public SEO pages.
    if (error) throw error;
    return { items: (data ?? []).map(toListItem), total: count ?? 0, limit: page.limit, offset: page.offset };
  }
}

@Module({ controllers: [PublicController] })
export class PublicModule {}
