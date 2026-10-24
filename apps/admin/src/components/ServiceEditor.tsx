'use client';

import { useState, useTransition } from 'react';

import { CATEGORIES, formatZar, type ServiceCategory } from '@smomo/shared';

import {
  createService,
  deleteService,
  setServiceActive,
  updateService,
} from '@/app/(console)/services/actions';
import { Tag } from '@/components/Tag';

export type ServiceRow = {
  id: string;
  category: ServiceCategory;
  title: string;
  description: string | null;
  duration_minutes: number | null;
  indicative_price_zar: number | null;
  is_active: boolean;
};

/** The add/edit fields, shared so a new row and an edited row cannot diverge. */
function Fields({ row }: { row?: ServiceRow }) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
        <label className="field">
          <span className="text-xs font-medium text-text">Category</span>
          <select name="category" className="input" defaultValue={row?.category ?? CATEGORIES[0].value}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="text-xs font-medium text-text">Name</span>
          <input name="title" className="input" defaultValue={row?.title ?? ''} required minLength={2} maxLength={120} placeholder="Gel overlay with art" />
        </label>
      </div>
      <label className="field">
        <span className="text-xs font-medium text-text">Description</span>
        <input name="description" className="input" defaultValue={row?.description ?? ''} maxLength={500} placeholder="Optional — what's included" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="field">
          <span className="text-xs font-medium text-text">Typical price (R)</span>
          <input name="priceZar" className="input tnum" inputMode="numeric" defaultValue={row?.indicative_price_zar ?? ''} placeholder="Optional" />
        </label>
        <label className="field">
          <span className="text-xs font-medium text-text">Duration (minutes)</span>
          <input name="durationMinutes" className="input tnum" inputMode="numeric" defaultValue={row?.duration_minutes ?? ''} placeholder="Optional" />
        </label>
      </div>
    </>
  );
}

/**
 * The service list and its editor.
 *
 * Prices are described as "typical" throughout, because that is what they are: the actual
 * price for a job is the offer the pro sends, and `indicative_price_zar` only feeds the
 * "from R…" figure on their public profile. Calling it "price" would imply a fixed rate.
 */
export function ServiceEditor({ rows }: { rows: ServiceRow[] }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string>();
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const run = (fn: (d: FormData) => Promise<{ ok: boolean; error?: string }>, data: FormData, onOk?: () => void) => {
    setError(undefined);
    startTransition(async () => {
      const result = await fn(data);
      if (result.ok) onOk?.();
      else setError(result.error);
    });
  };

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="panel overflow-hidden">
        <div className="panel-head">
          <h2 className="panel-title">
            Services
            <span className="ml-2 font-normal tnum text-text-muted">{rows.length}</span>
          </h2>
          {!adding ? (
            <button type="button" className="btn-console btn-console-primary" onClick={() => setAdding(true)}>
              Add a service
            </button>
          ) : null}
        </div>

        {adding ? (
          <form
            className="panel-body space-y-3 border-b border-border"
            action={(d) => run(createService, d, () => setAdding(false))}
          >
            <Fields />
            <div className="flex gap-2">
              <button type="submit" className="btn-console btn-console-primary" disabled={pending}>
                {pending ? 'Adding…' : 'Add service'}
              </button>
              <button type="button" className="btn-console" disabled={pending} onClick={() => setAdding(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        {rows.length === 0 && !adding ? (
          <div className="panel-body text-sm text-text-muted">
            No services yet. They show on your public profile as a “from R…” price and help
            clients understand what you offer.
          </div>
        ) : null}

        {rows.map((s) =>
          editingId === s.id ? (
            <form
              key={s.id}
              className="panel-body space-y-3 border-b border-border last:border-b-0"
              action={(d) => {
                d.set('id', s.id);
                run(updateService, d, () => setEditingId(undefined));
              }}
            >
              <Fields row={s} />
              <div className="flex gap-2">
                <button type="submit" className="btn-console btn-console-primary" disabled={pending}>
                  {pending ? 'Saving…' : 'Save'}
                </button>
                <button type="button" className="btn-console" disabled={pending} onClick={() => setEditingId(undefined)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div
              key={s.id}
              className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{s.title}</span>
                  <Tag>{CATEGORIES.find((c) => c.value === s.category)?.label ?? s.category}</Tag>
                  {!s.is_active ? <Tag tone="neutral">hidden</Tag> : null}
                </div>
                <p className="mt-0.5 text-sm text-text-muted">
                  {s.indicative_price_zar != null ? `from ${formatZar(s.indicative_price_zar)}` : 'No typical price'}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                </p>
                {s.description ? <p className="mt-1 text-sm">{s.description}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button type="button" className="btn-console" disabled={pending} onClick={() => setEditingId(s.id)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-console"
                  disabled={pending}
                  onClick={() => {
                    const d = new FormData();
                    d.set('id', s.id);
                    d.set('active', String(!s.is_active));
                    run(setServiceActive, d);
                  }}
                >
                  {s.is_active ? 'Hide' : 'Show'}
                </button>
                <button
                  type="button"
                  className="btn-console btn-console-danger"
                  disabled={pending}
                  onClick={() => {
                    const d = new FormData();
                    d.set('id', s.id);
                    run(deleteService, d);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
