import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { SupabaseService } from '../supabase/supabase.service';
import { IS_PUBLIC, REQUIRE_REGISTERED } from './decorators';

function extractToken(req: any): string | null {
  const header: string | undefined = req.headers?.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  return type === 'Bearer' && token ? token : null;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly supabase: SupabaseService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest();
    const token = extractToken(req);

    if (!token) {
      if (isPublic) {
        req.user = null;
        req.db = this.supabase.forUser(null);
        return true;
      }
      throw new UnauthorizedException('Missing bearer token');
    }

    const user = await this.supabase.getUser(token);
    if (!user) {
      if (isPublic) {
        req.user = null;
        req.db = this.supabase.forUser(null);
        return true;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }

    req.user = { id: user.id, isAnonymous: !!user.is_anonymous, token };
    req.db = this.supabase.forUser(token);

    const requireRegistered = this.reflector.getAllAndOverride<boolean>(REQUIRE_REGISTERED, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (requireRegistered && req.user.isAnonymous) {
      throw new ForbiddenException('You need a registered account to do this.');
    }

    return true;
  }
}
