'use client';

import { useState, useTransition } from 'react';

import type { ActionResult } from '@/app/(console)/platform/actions';

type Choice = {
  label: string;
  /** The form fields this choice submits, beyond the record id. */
  fields: Record<string, string>;
  tone?: 'primary' | 'danger' | 'plain';
};

/**
 * A row's decision controls: a small set of mutually exclusive choices, each a single
 * click, with the error shown next to the buttons rather than as a page-level banner —
 * a moderation table can have twenty rows and a banner would not say which one failed.
 */
export function DecisionButtons({
  id,
  choices,
  action,
}: {
  id: string;
  choices: Choice[];
  action: (data: FormData) => Promise<ActionResult>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const submit = (choice: Choice) => {
    setError(undefined);
    const data = new FormData();
    data.set('id', id);
    for (const [k, v] of Object.entries(choice.fields)) data.set(k, v);
    startTransition(async () => {
      const result = await action(data);
      if (!result.ok) setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-2">
        {choices.map((c) => (
          <button
            key={c.label}
            type="button"
            disabled={pending}
            onClick={() => submit(c)}
            className={
              c.tone === 'primary'
                ? 'btn-console btn-console-primary'
                : c.tone === 'danger'
                  ? 'btn-console btn-console-danger'
                  : 'btn-console'
            }
          >
            {pending ? '…' : c.label}
          </button>
        ))}
      </div>
      {error ? (
        <p className="max-w-[18rem] text-right text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
