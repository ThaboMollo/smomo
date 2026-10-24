import { Body, Controller, ForbiddenException, Get, Module, Param, Post } from '@nestjs/common';

import {
  zResolveDispute,
  zResolveReport,
  type ResolveDisputeInput,
  type ResolveReportInput,
} from '@smomo/shared';
import { Db, RequireRegistered } from '../auth/decorators';
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
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zResolveReport)) body: ResolveReportInput,
  ) {
    await ensureAdmin(db);
    // resolve_report() records resolved_by from auth.uid() and re-checks is_admin() in the
    // database: migration 12 revoked direct writes to reports.status/resolution/resolved_by,
    // so ensureAdmin above is a fast pre-check, not the boundary.
    const { error } = await db.rpc('resolve_report', {
      p_report_id: id,
      p_status: body.status,
      // Safe to omit when absent: p_resolution is declared `default null`, so PostgREST
      // still resolves the overload. (The save_business_profile 500 was the same shape
      // with no DB default — see spec RC-2.)
      p_resolution: body.resolution,
    });
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
    @Param('paymentId') paymentId: string,
    @Body(new ZodValidationPipe(zResolveDispute)) body: ResolveDisputeInput,
  ) {
    await ensureAdmin(db);
    // As with resolve_report: migration 12 revoked direct writes to payments, and
    // resolve_dispute() stamps verified_at/verified_by itself from auth.uid().
    const { error } = await db.rpc('resolve_dispute', {
      p_payment_id: paymentId,
      p_resolve_as: body.resolveAs,
    });
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
