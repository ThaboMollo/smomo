import { Body, Controller, Module, Param, Post } from '@nestjs/common';

import { zMakeOffer, type MakeOfferInput } from '@smomo/shared';
import { Db, RequireRegistered } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

@RequireRegistered()
@Controller('offers')
class OffersController {
  @Post()
  async make(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zMakeOffer)) input: MakeOfferInput,
  ): Promise<{ id: string }> {
    const { data, error } = await db.rpc('make_offer', {
      p_request_id: input.requestId,
      p_price: input.price,
      p_message: input.message,
    });
    if (error) throw error;
    return { id: data as string };
  }

  @Post(':offerId/accept')
  async accept(
    @Db() db: SupaClient,
    @Param('offerId') offerId: string,
  ): Promise<{ bookingId: string }> {
    const { data, error } = await db.rpc('accept_offer', { p_offer_id: offerId });
    if (error) throw error;
    return { bookingId: data as string };
  }
}

@Module({ controllers: [OffersController] })
export class OffersModule {}
