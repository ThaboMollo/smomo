'use client';

import Image from 'next/image';
import { useState, useTransition } from 'react';

import { categoryLabel, formatDateShort, type ServiceCategory } from '@smomo/shared';

import { deleteItem, setCaption, setItemPublic } from '@/app/(console)/portfolio/actions';
import { Tag } from '@/components/Tag';

export type PortfolioRow = {
  id: string;
  image_url: string;
  caption: string | null;
  category: ServiceCategory | null;
  is_public: boolean;
  source: string;
  created_at: string;
};

/**
 * The pro's portfolio.
 *
 * `source` distinguishes a photo the pro uploaded themselves from one captured as
 * proof-of-work at the end of a job. That matters for the second kind: the client had to
 * consent to it appearing publicly, so the item is labelled rather than looking like an
 * ordinary upload the pro fully controls.
 */
export function PortfolioGrid({ rows }: { rows: PortfolioRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [editingId, setEditingId] = useState<string>();

  const run = (fn: (d: FormData) => Promise<{ ok: boolean; error?: string }>, data: FormData, onOk?: () => void) => {
    setError(undefined);
    startTransition(async () => {
      const result = await fn(data);
      if (result.ok) onOk?.();
      else setError(result.error);
    });
  };

  if (rows.length === 0) {
    return (
      <div className="panel">
        <div className="panel-body text-sm text-text-muted">
          <p className="font-medium text-text">No photos yet.</p>
          <p className="mt-1">
            Upload work from the SMOMO app, or finish a job and capture proof-of-work — with
            the client&apos;s consent it lands here automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((item) => (
          <figure key={item.id} className="panel overflow-hidden">
            <div className="relative aspect-[4/5] bg-card-muted">
              <Image
                src={item.image_url}
                alt={item.caption ?? 'Portfolio photo'}
                fill
                sizes="(min-width: 1024px) 20rem, (min-width: 640px) 45vw, 90vw"
                className="object-cover"
              />
              {!item.is_public ? (
                <span className="absolute left-2 top-2">
                  <Tag tone="neutral">hidden</Tag>
                </span>
              ) : null}
            </div>

            <figcaption className="space-y-2 p-3">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {item.category ? <Tag>{categoryLabel(item.category)}</Tag> : null}
                {item.source !== 'upload' ? <Tag tone="ok">from a job</Tag> : null}
                <span className="text-text-muted">{formatDateShort(item.created_at)}</span>
              </div>

              {editingId === item.id ? (
                <form
                  action={(d) => {
                    d.set('id', item.id);
                    run(setCaption, d, () => setEditingId(undefined));
                  }}
                  className="space-y-2"
                >
                  <input
                    name="caption"
                    className="input"
                    defaultValue={item.caption ?? ''}
                    maxLength={200}
                    placeholder="What this is"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-console btn-console-primary" disabled={pending}>
                      Save
                    </button>
                    <button type="button" className="btn-console" disabled={pending} onClick={() => setEditingId(undefined)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-sm">{item.caption || <span className="text-text-muted">No caption</span>}</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-console" disabled={pending} onClick={() => setEditingId(item.id)}>
                      Caption
                    </button>
                    <button
                      type="button"
                      className="btn-console"
                      disabled={pending}
                      onClick={() => {
                        const d = new FormData();
                        d.set('id', item.id);
                        d.set('isPublic', String(!item.is_public));
                        run(setItemPublic, d);
                      }}
                    >
                      {item.is_public ? 'Hide' : 'Show'}
                    </button>
                    <button
                      type="button"
                      className="btn-console btn-console-danger"
                      disabled={pending}
                      onClick={() => {
                        const d = new FormData();
                        d.set('id', item.id);
                        run(deleteItem, d);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
