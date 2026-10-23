import {
  Body,
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';

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

/**
 * No `phone` here: contact details moved to profile_contact (migration 04),
 * which is row-secured so only a counterparty can read them. The booking detail
 * endpoint fetches them through booking_counterparty_contact() instead.
 */
const PARTY_SELECT =
  '*, client:profiles!bookings_client_id_fkey(id, full_name, avatar_url, client_rating), practitioner:profiles!bookings_practitioner_id_fkey(id, full_name, avatar_url, client_rating)';

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

    const practitionerId = (booking as any).practitioner_id as string;

    const [payments, reviews, counterparty, payout] = await Promise.all([
      db.from('payments').select('*').eq('booking_id', id).order('created_at'),
      db.from('reviews').select('*').eq('booking_id', id),
      // Authorised in the database: returns no rows unless the caller is a party.
      db.rpc('booking_counterparty_contact', { p_booking_id: id }),
      // RLS on practitioner_payout allows the practitioner, an admin, or a
      // client who has a booking with them — which is exactly this caller.
      db
        .from('practitioner_payout')
        .select('payshap_proxy')
        .eq('practitioner_id', practitionerId)
        .maybeSingle(),
    ]);

    const other = (counterparty.data ?? [])[0] ?? null;

    return {
      booking: booking as unknown as BookingWithParties,
      payments: payments.data ?? [],
      reviews: reviews.data ?? [],
      counterparty: other
        ? {
            user_id: other.user_id,
            full_name: other.full_name ?? null,
            avatar_url: other.avatar_url ?? null,
            phone: other.phone ?? null,
          }
        : null,
      payshapProxy: payout.data?.payshap_proxy ?? null,
    };
  }

  @RequireRegistered()
  @Post(':id/start')
  async start(@Db() db: SupaClient, @Param('id') id: string) {
    const { error } = await db.from('bookings').update({ status: 'in_progress' }).eq('id', id);
    if (error) throw error;
    return { ok: true };
  }

  /**
   * One transaction via complete_booking() (migration 09): the status change and
   * the practitioner-to-client review commit together, and the reviewed client is
   * read from the booking rather than taken from the request body.
   */
  @RequireRegistered()
  @Post(':id/complete')
  async complete(
    @Db() db: SupaClient,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(zCompleteBooking)) input: CompleteBookingInput,
  ) {
    const { error } = await db.rpc('complete_booking', {
      p_booking_id: id,
      p_rating: input.rating,
      p_proof_image_url: input.proofImageUrl,
      p_comment: input.comment,
    });
    if (error) throw error;
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
  /**
   * The reviewed practitioner comes from the booking, not from the request body.
   * reviews_enforce_parties() (migration 02) re-derives it server-side too, so a
   * caller cannot aim a review at someone who is not party to the booking.
   */
  @Post('client')
  async client(
    @Db() db: SupaClient,
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(zClientReview)) input: ClientReviewInput,
  ) {
    const { data: booking, error: bErr } = await db
      .from('bookings')
      .select('practitioner_id')
      .eq('id', input.bookingId)
      .maybeSingle();
    if (bErr) throw bErr;
    if (!booking) throw new NotFoundException('Booking not found');

    const { error } = await db.from('reviews').insert({
      booking_id: input.bookingId,
      reviewer_id: user.id,
      reviewee_id: booking.practitioner_id,
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
