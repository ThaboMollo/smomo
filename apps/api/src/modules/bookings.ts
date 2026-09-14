import { Body, Controller, Get, Module, Param, Post, Query } from '@nestjs/common';

import {
  zCancelBooking,
  zClientReview,
  zCompleteBooking,
  zMarkPaid,
  zVerifyPayment,
  type BookingDetail,
  type BookingWithParties,
  type CancelBookingInput,
  type ClientReviewInput,
  type CompleteBookingInput,
  type MarkPaidInput,
  type VerifyPaymentInput,
} from '@smomo/shared';
import { CurrentUser, Db, RequireRegistered, type RequestUser } from '../auth/decorators';
import type { Db as SupaClient } from '../supabase/supabase.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';

const PARTY_SELECT =
  '*, client:profiles!bookings_client_id_fkey(id, full_name, avatar_url, phone, client_rating), practitioner:profiles!bookings_practitioner_id_fkey(id, full_name, avatar_url, phone, client_rating)';

@Controller('bookings')
class BookingsController {
  @Get()
  async mine(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Query('role') role: 'client' | 'practitioner',
  ): Promise<BookingWithParties[]> {
    const col = role === 'practitioner' ? 'practitioner_id' : 'client_id';
    const { data, error } = await db
      .from('bookings')
      .select(PARTY_SELECT)
      .eq(col, user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as BookingWithParties[];
  }

  @Get(':id')
  async get(@Db() db: SupaClient, @Param('id') id: string): Promise<BookingDetail | null> {
    const { data: booking, error } = await db
      .from('bookings')
      .select(PARTY_SELECT)
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!booking) return null;
    const [payments, reviews] = await Promise.all([
      db.from('payments').select('*').eq('booking_id', id).order('created_at'),
      db.from('reviews').select('*').eq('booking_id', id),
    ]);
    return {
      booking: booking as unknown as BookingWithParties,
      payments: payments.data ?? [],
      reviews: reviews.data ?? [],
    };
  }

  @RequireRegistered()
  @Post(':id/start')
  async start(@Db() db: SupaClient, @Param('id') id: string) {
    const { error } = await db.from('bookings').update({ status: 'in_progress' }).eq('id', id);
    if (error) throw error;
    return { ok: true };
  }

  @RequireRegistered()
  @Post(':id/complete')
  async complete(
    @Db() db: SupaClient,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zCompleteBooking)) input: CompleteBookingInput,
  ) {
    const { error: upErr } = await db.from('bookings').update({ status: 'completed' }).eq('id', id);
    if (upErr) throw upErr;
    const { error: rvErr } = await db.from('reviews').insert({
      booking_id: id,
      reviewer_id: user.id,
      reviewee_id: input.clientId,
      direction: 'p2c',
      rating: input.rating,
      comment: input.comment,
      proof_image_url: input.proofImageUrl,
    });
    if (rvErr) throw rvErr;
    return { ok: true };
  }

  @RequireRegistered()
  @Post(':id/cancel')
  async cancel(
    @Db() db: SupaClient,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zCancelBooking)) input: CancelBookingInput,
  ) {
    const { error } = await db
      .from('bookings')
      .update({ status: 'cancelled', cancel_reason: input.reason })
      .eq('id', id);
    if (error) throw error;
    return { ok: true };
  }
}

@RequireRegistered()
@Controller('payments')
class PaymentsController {
  @Post('mark-paid')
  async markPaid(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zMarkPaid)) input: MarkPaidInput,
  ) {
    const { error } = await db.rpc('mark_payment_paid', {
      p_payment_id: input.paymentId,
      p_reference: input.reference,
    });
    if (error) throw error;
    return { ok: true };
  }

  @Post('verify')
  async verify(
    @Db() db: SupaClient,
    @Body(new ZodValidationPipe(zVerifyPayment)) input: VerifyPaymentInput,
  ) {
    const { error } = await db.rpc('verify_payment', {
      p_payment_id: input.paymentId,
      p_verified: input.verified,
      p_dispute_reason: input.disputeReason,
    });
    if (error) throw error;
    return { ok: true };
  }
}

@RequireRegistered()
@Controller('reviews')
class ReviewsController {
  @Post('client')
  async client(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zClientReview)) input: ClientReviewInput,
  ) {
    const { error } = await db.from('reviews').insert({
      booking_id: input.bookingId,
      reviewer_id: user.id,
      reviewee_id: input.practitionerId,
      direction: 'c2p',
      rating: input.rating,
      comment: input.comment,
    });
    if (error) throw error;
    return { ok: true };
  }
}

@Module({ controllers: [BookingsController, PaymentsController, ReviewsController] })
export class BookingsModule {}
