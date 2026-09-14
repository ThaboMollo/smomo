import { Body, Controller, Module, Post } from '@nestjs/common';

import { zCreateReport, type CreateReportInput } from '@smomo/shared';
import { CurrentUser, Db, RequireRegistered, type RequestUser } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@RequireRegistered()
@Controller('reports')
class ReportsController {
  @Post()
  async create(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zCreateReport)) input: CreateReportInput,
  ) {
    const { error } = await db.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: input.reportedUserId,
      booking_id: input.bookingId ?? null,
      reason: input.reason,
      details: input.details,
    });
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [ReportsController] })
export class ReportsModule {}
