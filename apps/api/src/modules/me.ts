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
    const { data: profile } = await db.from('profiles').select('*').eq('id', user.id).maybeSingle();
    let practitioner: any = null;
    let subscription: any = null;
    if (profile?.is_practitioner) {
      const [pp, sub] = await Promise.all([
        db.from('practitioner_profiles').select('*').eq('id', user.id).maybeSingle(),
        db.from('subscriptions').select('*').eq('practitioner_id', user.id).maybeSingle(),
      ]);
      practitioner = pp.data ?? null;
      subscription = sub.data ?? null;
    }
    return { profile: profile ?? null, practitioner, subscription };
  }

  @RequireRegistered()
  @Patch()
  async update(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zUpdateProfile)) input: UpdateProfileInput,
  ) {
    const { error } = await db.from('profiles').update(input).eq('id', user.id);
    if (error) throw error;
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
