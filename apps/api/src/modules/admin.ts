import { Body, Controller, ForbiddenException, Get, Module, Param, Post } from '@nestjs/common';

import { Db, RequireRegistered } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';

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
    @Body() body: { status: string; resolution?: string },
  ) {
    await ensureAdmin(db);
    const { error } = await db
      .from('reports')
      .update({ status: body.status as any, resolution: body.resolution })
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
    @Param('paymentId') paymentId: string,
    @Body() body: { resolveAs: 'verified' | 'rejected' },
  ) {
    await ensureAdmin(db);
    const { error } = await db
      .from('payments')
      .update({ status: body.resolveAs, verified_at: new Date().toISOString() })
      .eq('id', paymentId);
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
