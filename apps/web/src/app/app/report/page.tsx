'use client';

import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/Icon';
import { api } from '@/lib/api';

const REASONS = ['No-show', 'Inappropriate behaviour', 'Payment issue', 'Poor service', 'Other'];
const inputCls = 'w-full rounded border border-border bg-card px-4 py-3';

export default function Report() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUserId(params.get('userId'));
    setBookingId(params.get('bookingId'));
  }, []);

  const submit = useMutation({
    mutationFn: () =>
      api.reports.create({
        reportedUserId: userId!,
        bookingId: bookingId ?? null,
        reason,
        details: details.trim() || undefined,
      }),
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.back(), 1500);
    },
  });

  if (done) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <p className="inline-flex items-center justify-center gap-2 text-lg">
          <Icon icon={faCircleCheck} size={20} className="text-success" />
          Thanks — our team will review this.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl">Report a problem</h1>
      {!userId ? (
        <p className="mt-4 text-text-muted">Nothing to report — open this from a booking.</p>
      ) : (
        <>
          <p className="mb-2 mt-6 text-sm font-medium text-text-muted">What went wrong?</p>
          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`rounded border px-4 py-2 text-sm font-medium ${reason === r ? 'border-primary bg-primary-100 text-primary-700' : 'border-border bg-card'}`}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            placeholder="Tell us what happened"
            className={`mt-4 min-h-28 ${inputCls}`}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />

          <button
            onClick={() => submit.mutate()}
            disabled={submit.isPending}
            className="mt-4 w-full rounded bg-danger py-3 font-medium text-white disabled:opacity-50"
          >
            {submit.isPending ? 'Submitting…' : 'Submit report'}
          </button>
        </>
      )}
    </div>
  );
}
