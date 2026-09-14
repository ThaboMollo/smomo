'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  BOOKING_MODE_LABEL,
  categoryEmoji,
  categoryLabel,
  formatWhen,
  formatZar,
  type Payment,
} from '@smomo/shared';

import { ChatPanel } from '@/components/ChatPanel';
import { Badge, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data, isLoading } = useQuery({ queryKey: ['booking', id], queryFn: () => api.bookings.get(id) });
  const booking = data?.booking;
  const { data: provider } = useQuery({
    queryKey: ['provider', booking?.practitioner_id],
    queryFn: () => api.providers.get(booking!.practitioner_id),
    enabled: !!booking?.practitioner_id,
  });
  const payshap = provider?.practitioner.payshap_proxy ?? null;

  const refetch = () => qc.invalidateQueries({ queryKey: ['booking', id] });

  if (isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!booking) return <p className="text-text-muted">Booking not found.</p>;
  const isClient = booking.client_id === userId;
  const other = isClient ? booking.practitioner : booking.client;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {categoryEmoji(booking.category)} {categoryLabel(booking.category)}
        </h1>
        <Badge tone={booking.status === 'completed' ? 'success' : 'primary'}>
          {booking.status.replace('_', ' ')}
        </Badge>
      </div>

      <Card>
        <p className="font-semibold">{other?.full_name ?? (isClient ? 'Provider' : 'Client')}</p>
        <div className="mt-2 space-y-1 text-sm text-text-muted">
          <p>When: {formatWhen(booking.scheduled_at)}</p>
          <p>Where: {BOOKING_MODE_LABEL[booking.booking_mode]}</p>
          {booking.address ? <p>Address: {booking.address}</p> : null}
          <p>Agreed price: {formatZar(booking.final_price_zar)}</p>
        </div>
      </Card>

      {!isClient && (booking.status === 'confirmed' || booking.status === 'in_progress') ? (
        <PractitionerActions bookingId={id} clientId={booking.client_id} status={booking.status} onDone={refetch} />
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-bold">Payment (PayShap)</h2>
        <div className="space-y-3">
          {data?.payments.map((p) => (
            <PaymentCard key={p.id} payment={p} isClient={isClient} payshap={payshap} onDone={refetch} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Chat</h2>
        {userId ? <ChatPanel bookingId={id} userId={userId} /> : null}
      </section>
    </div>
  );
}

function PractitionerActions({
  bookingId,
  clientId,
  status,
  onDone,
}: {
  bookingId: string;
  clientId: string;
  status: 'confirmed' | 'in_progress';
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>();

  const start = useMutation({ mutationFn: () => api.bookings.start(bookingId), onSuccess: onDone });

  const upload = useMutation({
    mutationFn: (file: File) => uploadImage('portfolio', file),
    onSuccess: (url) => setProofUrl(url),
    onError: (e: any) => setError(e?.message ?? 'Upload failed'),
  });

  const complete = useMutation({
    mutationFn: () =>
      api.bookings.complete(bookingId, {
        clientId,
        rating,
        comment: comment.trim() || undefined,
        proofImageUrl: proofUrl!,
      }),
    onSuccess: onDone,
    onError: (e: any) => setError(e?.message ?? 'Could not complete'),
  });

  if (status === 'confirmed') {
    return (
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Ready to begin?</p>
          <p className="text-sm text-text-muted">Mark the job as started when you begin.</p>
        </div>
        <button onClick={() => start.mutate()} disabled={start.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          Start job
        </button>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <p className="font-semibold">Complete job</p>
      <p className="text-sm text-text-muted">Capture a photo of the finished work (adds to your portfolio).</p>
      {proofUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={proofUrl} alt="Proof of work" className="h-40 w-full rounded-xl object-cover" />
      ) : null}
      <input
        type="file"
        accept="image/*"
        disabled={upload.isPending}
        onChange={(e) => {
          setError(undefined);
          const f = e.target.files?.[0];
          if (f) upload.mutate(f);
          e.target.value = '';
        }}
        className="text-sm"
      />
      {upload.isPending ? <p className="text-sm text-text-muted">Uploading…</p> : null}

      <div>
        <p className="text-sm font-semibold text-text-muted">Rate the client</p>
        <div className="mt-1 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? 'text-primary' : 'text-text-faint'}`}>
              ★
            </button>
          ))}
        </div>
      </div>
      <input placeholder="Comment (optional)" className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <button onClick={() => complete.mutate()} disabled={!proofUrl || complete.isPending} className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50">
        {complete.isPending ? 'Completing…' : 'Complete & rate'}
      </button>
    </Card>
  );
}

function PaymentCard({
  payment,
  isClient,
  payshap,
  onDone,
}: {
  payment: Payment;
  isClient: boolean;
  payshap: string | null;
  onDone: () => void;
}) {
  const [reference, setReference] = useState('');
  const markPaid = useMutation({
    mutationFn: () => api.payments.markPaid({ paymentId: payment.id, reference: reference.trim() }),
    onSuccess: onDone,
  });
  const verify = useMutation({
    mutationFn: (verified: boolean) =>
      api.payments.verify({
        paymentId: payment.id,
        verified,
        disputeReason: verified ? undefined : 'Practitioner reports payment not received',
      }),
    onSuccess: onDone,
  });

  const tone = payment.status === 'verified' ? 'success' : 'default';

  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="font-semibold">
          {payment.payment_type === 'deposit' ? 'Deposit' : payment.payment_type === 'balance' ? 'Balance' : 'Payment'} ·{' '}
          {formatZar(payment.amount_zar)}
        </span>
        <Badge tone={tone}>{payment.status}</Badge>
      </div>

      {isClient && payment.status === 'pending' && !payment.marked_paid_at ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm text-text-muted">
            Pay {formatZar(payment.amount_zar)} via your banking app's PayShap to:
          </p>
          <p className="text-lg font-bold text-primary">{payshap ?? '—'}</p>
          <input
            placeholder="PayShap reference"
            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
          <button
            onClick={() => markPaid.mutate()}
            disabled={markPaid.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            I've paid
          </button>
        </div>
      ) : null}

      {isClient && payment.status === 'pending' && payment.marked_paid_at ? (
        <p className="mt-2 text-sm text-text-muted">Awaiting the provider to verify (ref {payment.payshap_reference}).</p>
      ) : null}

      {!isClient && payment.status === 'pending' && payment.marked_paid_at ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => verify.mutate(true)} className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            Verify
          </button>
          <button onClick={() => verify.mutate(false)} className="flex-1 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white">
            Not received
          </button>
        </div>
      ) : null}
    </Card>
  );
}
