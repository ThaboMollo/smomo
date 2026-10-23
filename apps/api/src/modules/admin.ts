import { Body, Controller, ForbiddenException, Get, Module, Param, Post } from '@nestjs/common';

import {
  zResolveDispute,
  zResolveReport,
  type ResolveDisputeInput,
  type ResolveReportInput,
} from '@smomo/shared';
import { CurrentUser, Db, RequireRegistered, type RequestUser } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

async function ensureAdmin(db: SupaClient) {
  const { data, error } = await db.rpc('is_admin');
  if (error) throw error;
  if (!data) throw new ForbiddenException('Admin only');
}

@RequireRegistered()
@Controller('admin')
class AdminController {
  @Get('reports')
  async reports(@Db() db: SupaClient) {
    await ensureAdmin(db);
    const { data, error } = await db
      .from('reports')
      .select(
        '*, reporter:profiles!reports_reporter_id_fkey(full_name), reported:profiles!reports_reported_user_id_fkey(full_name)',
      )
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  @Post('reports/:id/resolve')
  async resolveReport(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zResolveReport)) body: ResolveReportInput,
  ) {
    await ensureAdmin(db);
    // resolved_by was never recorded before, so who actioned a report was lost.
    const { error } = await db
      .from('reports')
      .update({ status: body.status, resolution: body.resolution, resolved_by: user.id })
      .eq('id', id);
    if (error) throw error;
    return { ok: true };
  }

  @Get('disputes')
  async disputes(@Db() db: SupaClient) {
    await ensureAdmin(db);
    const { data, error } = await db
      .from('payments')
      .select(
        '*, booking:bookings!payments_booking_id_fkey(id, category, final_price_zar), payer:profiles!payments_payer_id_fkey(full_name), payee:profiles!payments_payee_id_fkey(full_name)',
      )
      .eq('status', 'disputed')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  }

  @Post('disputes/:paymentId/resolve')
  async resolveDispute(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Param('paymentId') paymentId: string,
    @Body(new ZodValidationPipe(zResolveDispute)) body: ResolveDisputeInput,
  ) {
    await ensureAdmin(db);
    const { error } = await db
      .from('payments')
      .update({
        status: body.resolveAs,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', paymentId);
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
