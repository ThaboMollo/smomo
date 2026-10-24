'use client';

import { useState, useTransition } from 'react';

import { decideVerification } from '@/app/(console)/platform/verification/actions';

/**
 * Approve or reject one practitioner.
 *
 * Rejecting opens a reason box first: the note is shown back to the pro, and the database
 * refuses a rejection without one, so asking before submitting is kinder than bouncing
 * them off a server error. Approving is a single click — there is nothing to explain.
 */
export function VerificationDecision({
  practitionerId,
  status,
}: {
  practitionerId: string;
  status: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();

  const submit = (decision: 'verified' | 'rejected') => {
    setError(undefined);
    const data = new FormData();
    data.set('practitionerId', practitionerId);
    data.set('status', decision);
    data.set('note', decision === 'rejected' ? note : '');
    startTransition(async () => {
      const result = await decideVerification(data);
      if (!result.ok) setError(result.error);
      else {
        setRejecting(false);
        setNote('');
      }
    });
  };

  if (rejecting) {
    return (
      <div className="flex min-w-[18rem] flex-col gap-2">
        <label className="field">
          <span className="text-xs font-medium text-text">Reason (shown to the pro)</span>
          <input
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. ID number did not match the name given"
            autoFocus
          />
        </label>
        {error ? (
          <p className="text-xs text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-console btn-console-danger"
            disabled={pending || !note.trim()}
            onClick={() => submit('rejected')}
          >
            {pending ? 'Rejecting…' : 'Confirm rejection'}
          </button>
          <button
            type="button"
            className="btn-console"
            disabled={pending}
            onClick={() => {
              setRejecting(false);
              setError(undefined);
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex gap-2">
        {status !== 'verified' ? (
          <button
            type="button"
            className="btn-console btn-console-primary"
            disabled={pending}
            onClick={() => submit('verified')}
          >
            {pending ? 'Saving…' : 'Verify'}
          </button>
        ) : null}
        {status !== 'rejected' ? (
          <button
            type="button"
            className="btn-console btn-console-danger"
            disabled={pending}
            onClick={() => setRejecting(true)}
          >
            Reject
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
