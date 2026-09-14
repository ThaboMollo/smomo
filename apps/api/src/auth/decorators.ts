import { SetMetadata, createParamDecorator, type ExecutionContext } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
/** Allow unauthenticated access (no bearer token required). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const REQUIRE_REGISTERED = 'requireRegistered';
/** Block anonymous Supabase users (must have upgraded to a real account). */
export const RequireRegistered = () => SetMetadata(REQUIRE_REGISTERED, true);

export type RequestUser = { id: string; isAnonymous: boolean; token: string };

/** The authenticated user (or null on public routes without a token). */
export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): RequestUser | null =>
    ctx.switchToHttp().getRequest().user ?? null,
);

/** A Supabase client scoped to the caller's JWT (or anon on public routes). */
export const Db = createParamDecorator(
  (_data, ctx: ExecutionContext): import('../supabase/supabase.service').Db =>
    ctx.switchToHttp().getRequest().db,
);
