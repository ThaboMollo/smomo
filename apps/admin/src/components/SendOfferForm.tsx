'use client';

import { useState, useTransition } from 'react';

import { sendOffer } from '@/app/(console)/offers/actions';

/**
 * Inline offer form, opened from a feed row.
 *
 * Prefilled with the client's stated maximum where there is one: that is the number the
 * pro is most likely to send, and it saves retyping. Collapsed by default so a feed of
 * twenty requests is a readable list rather than twenty forms.
 */
export function SendOfferForm({
  requestId,
  suggested,
}: {
  requestId: string;
  suggested: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(suggested != null ? String(suggested) : '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button type="button" className="btn-console btn-console-primary" onClick={() => setOpen(true)}>
        Send offer
      </button>
    );
  }

  const submit = () => {
    setError(undefined);
    const data = new FormData();
    data.set('requestId', requestId);
    data.set('price', price);
    data.set('message', message);
    startTransition(async () => {
      const result = await sendOffer(data);
      if (result.ok) setOpen(false);
      else setError(result.error);
    });
  };

  return (
    <div className="flex min-w-[20rem] flex-col gap-2">
      <div className="flex gap-2">
        <label className="field">
          <span className="text-xs font-medium text-text">Your price (R)</span>
          <input
            className="input tnum w-28"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            autoFocus
          />
        </label>
        <label className="field flex-1">
          <span className="text-xs font-medium text-text">Message (optional)</span>
          <input
            className="input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's included, when you're free"
          />
        </label>
      </div>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-console btn-console-primary"
          disabled={pending || !price.trim()}
          onClick={submit}
        >
          {pending ? 'Sending…' : 'Send offer'}
        </button>
        <button
          type="button"
          className="btn-console"
          disabled={pending}
          onClick={() => {
            setOpen(false);
            setError(undefined);
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
