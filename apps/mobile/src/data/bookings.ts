import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export type { Booking, Payment, Review, BookingWithParties, BookingDetail } from '@smomo/shared';

export function useMyBookings(role: 'client' | 'practitioner') {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ['bookings', role, userId],
    enabled: !!userId,
    queryFn: () => api.bookings.mine(role),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: ['booking', id],
    enabled: !!id,
    queryFn: () => api.bookings.get(id!),
  });
}

function useInvalidateBooking() {
  const qc = useQueryClient();
  return (id: string) => {
    qc.invalidateQueries({ queryKey: ['booking', id] });
    qc.invalidateQueries({ queryKey: ['bookings'] });
  };
}

export function useStartBooking() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (id: string) => api.bookings.start(id),
    onSuccess: (_d, id) => invalidate(id),
  });
}

export function useCancelBooking() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: { id: string; reason: string }) =>
      api.bookings.cancel(input.id, { reason: input.reason }),
    onSuccess: (_d, v) => invalidate(v.id),
  });
}

export function useCompleteBooking() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: {
      bookingId: string;
      clientId: string;
      rating: number;
      comment?: string;
      proofImageUrl: string;
    }) =>
      api.bookings.complete(input.bookingId, {
        clientId: input.clientId,
        rating: input.rating,
        comment: input.comment,
        proofImageUrl: input.proofImageUrl,
      }),
    onSuccess: (_d, v) => invalidate(v.bookingId),
  });
}

export function useMarkPaid() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: { paymentId: string; reference: string; bookingId: string }) =>
      api.payments.markPaid({ paymentId: input.paymentId, reference: input.reference }),
    onSuccess: (_d, v) => invalidate(v.bookingId),
  });
}

export function useVerifyPayment() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: {
      paymentId: string;
      verified: boolean;
      disputeReason?: string;
      bookingId: string;
    }) =>
      api.payments.verify({
        paymentId: input.paymentId,
        verified: input.verified,
        disputeReason: input.disputeReason,
      }),
    onSuccess: (_d, v) => invalidate(v.bookingId),
  });
}

export function useSubmitClientReview() {
  const invalidate = useInvalidateBooking();
  return useMutation({
    mutationFn: (input: {
      bookingId: string;
      practitionerId: string;
      rating: number;
      comment?: string;
    }) =>
      api.reviews.client({
        bookingId: input.bookingId,
        practitionerId: input.practitionerId,
        rating: input.rating,
        comment: input.comment,
      }),
    onSuccess: (_d, v) => invalidate(v.bookingId),
  });
}
