'use client';

import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import {
  BOOKING_MODE_LABEL,
  CATEGORIES,
  categoryLabel,
  formatBudget,
  type BookingMode,
  type ServiceCategory,
} from '@smomo/shared';

import { Field, Steps } from '@/components/ui';
import { api } from '@/lib/api';
import { categoryImage } from '@/lib/catalog';
import { createClient } from '@/lib/supabase/client';
import { useCoords } from '@/lib/use-coords';

const STEP_LABEL = ['Service', 'Details', 'Review'] as const;

export default function NewRequest() {
  const router = useRouter();
  const { coords, source } = useCoords();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [mode, setMode] = useState<BookingMode>('mobile');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>();

  // Directed request: `?target=<providerId>&category=<cat>` prefills for a specific pro.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('target');
    const c = params.get('category');
    if (t) setTarget(t);
    if (c && CATEGORIES.some((x) => x.value === c)) setCategory(c as ServiceCategory);
  }, []);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const budgetErr =
    budgetMin && budgetMax && Number(budgetMin) > Number(budgetMax) ? 'Minimum is higher than maximum' : null;

  const publish = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error('Pick a service');
      let imageUrl: string | null = null;
      if (file) {
        const supabase = createClient();
        const uid = (await supabase.auth.getUser()).data.user?.id;
        const path = `${uid}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('request-photos').upload(path, file, {
          upsert: true,
        });
        if (upErr) throw upErr;
        imageUrl = supabase.storage.from('request-photos').getPublicUrl(path).data.publicUrl;
      }
      const res = await api.requests.create({
        category,
        bookingMode: mode,
        lat: coords.latitude,
        lng: coords.longitude,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        budgetMin: budgetMin ? Number(budgetMin) : null,
        budgetMax: budgetMax ? Number(budgetMax) : null,
        imageUrl,
        targetPractitionerId: target,
        consent,
        expiresMinutes: 30,
      });
      return res.id;
    },
    onSuccess: (id) => router.push(`/app/request/${id}`),
    onError: (e: any) => setError(e?.message ?? 'Could not post request'),
  });

  const next = () => {
    setError(undefined);
    if (step === 1 && !category) return setError('Pick a service to continue');
    if (step === 2 && budgetErr) return setError(budgetErr);
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const back = () => {
    setError(undefined);
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const numOnly = (v: string) => v.replace(/[^\d]/g, '');

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 pb-28">
      <div className="flex items-center justify-between">
        <button type="button" onClick={back} aria-label="Back" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card hover:bg-primary-100">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <Link href="/app" className="rounded-full px-3 py-2 text-sm text-text-muted hover:bg-primary-100">
          Cancel
        </Link>
      </div>

      <Steps step={step} total={3} label={STEP_LABEL[step - 1]} />

      {target ? (
        <p className="rounded-2xl bg-primary-100 px-4 py-3 text-sm text-primary-700">
          This request goes directly to the pro you picked.
        </p>
      ) : null}

      {step === 1 ? (
        <>
          <div>
            <h1 className="text-5xl">What do you need?</h1>
            <p className="mt-2 text-text-muted">Pick one. You can add details and a budget next.</p>
          </div>
          <div role="radiogroup" aria-label="Service" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {CATEGORIES.map((c) => {
              const on = category === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setCategory(c.value)}
                  className={`relative flex flex-col gap-3 rounded-[22px] border p-4 text-left transition-colors ${on ? 'border-primary bg-primary-100 ring-1 ring-primary' : 'border-border bg-card hover:border-primary-300'}`}
                >
                  <Image src={categoryImage(c.value)} alt="" width={48} height={48} className="h-12 w-12 rounded-xl object-cover" />
                  <span className={`font-medium ${on ? 'text-primary-700' : ''}`}>{c.label}</span>
                  {on ? (
                    <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12l5 5 9-10" />
                      </svg>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="field">
            <span className="font-medium text-text">Where should it happen?</span>
            <div role="radiogroup" aria-label="Where" className="segmented">
              {(['mobile', 'studio'] as BookingMode[]).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)}>
                  {BOOKING_MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div>
            <h1 className="text-5xl">Tell pros the details</h1>
            <p className="mt-2 text-text-muted">All optional, but clearer requests get better offers.</p>
          </div>
          <Field
            label={mode === 'mobile' ? 'Your address or area' : 'Your area'}
            hint={
              source === 'device'
                ? 'We also use your device location to find pros nearby.'
                : 'Location is off, so pros near Cape Town will see this. Turn on location for better matches.'
            }
          >
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Rosebank, Johannesburg" autoComplete="street-address" />
          </Field>
          <Field label="What would you like?">
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Knotless braids, mid-back length, this Saturday morning"
            />
          </Field>
          <div className="field">
            <span className="font-medium text-text">Budget (R)</span>
            <div className="grid grid-cols-2 gap-3">
              <input aria-label="Minimum budget in rand" placeholder="Min" inputMode="numeric" className="input tnum" value={budgetMin} onChange={(e) => setBudgetMin(numOnly(e.target.value))} aria-invalid={!!budgetErr || undefined} />
              <input aria-label="Maximum budget in rand" placeholder="Max" inputMode="numeric" className="input tnum" value={budgetMax} onChange={(e) => setBudgetMax(numOnly(e.target.value))} aria-invalid={!!budgetErr || undefined} />
            </div>
            {budgetErr ? <span className="text-sm text-danger">{budgetErr}</span> : null}
          </div>
          <div className="field">
            <span className="font-medium text-text">Reference photo</span>
            {preview ? (
              <div className="flex items-center gap-4 rounded-[20px] border border-border bg-card p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Your reference" className="h-20 w-20 rounded-2xl object-cover" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">{file?.name}</span>
                <button type="button" onClick={() => setFile(null)} className="btn btn-outline">
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-[20px] border border-dashed border-primary-300 bg-card px-4 py-7 text-center transition-colors hover:bg-primary-100">
                <span className="font-medium text-primary-700">Add a photo</span>
                <span className="text-sm text-text-muted">A look you love helps pros quote accurately</span>
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            )}
          </div>
        </>
      ) : null}

      {step === 3 && category ? (
        <>
          <div>
            <h1 className="text-5xl">Ready to send?</h1>
            <p className="mt-2 text-text-muted">
              {target ? 'The pro will reply with an offer.' : 'Pros nearby are notified and send you offers. Your request stays open for 30 minutes.'}
            </p>
          </div>
          <dl className="divide-y divide-border rounded-[24px] border border-border bg-card px-5">
            {(
              [
                ['Service', categoryLabel(category), 1],
                ['Where', BOOKING_MODE_LABEL[mode], 1],
                ['Area', address.trim() || 'Not given', 2],
                ['Details', description.trim() || 'Not given', 2],
                ['Budget', formatBudget(budgetMin ? Number(budgetMin) : null, budgetMax ? Number(budgetMax) : null) ?? 'Open to offers', 2],
                ['Photo', file ? file.name : 'None', 2],
              ] as const
            ).map(([k, v, s]) => (
              <div key={k} className="flex items-start justify-between gap-4 py-3.5">
                <dt className="w-20 shrink-0 text-sm text-text-muted">{k}</dt>
                <dd className="min-w-0 flex-1 break-words">{v}</dd>
                <button type="button" onClick={() => setStep(s)} className="text-sm font-medium text-primary-700 hover:underline">
                  Edit
                </button>
              </div>
            ))}
          </dl>
          <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-border bg-card p-4 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--color-primary)]" />
            <span className="text-text-muted">
              I&apos;m happy for a photo of the finished work to appear in the pro&apos;s public portfolio.
            </span>
          </label>
        </>
      ) : null}

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950" role="alert">
          {error}
        </p>
      ) : null}

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-[68px] z-20 border-t border-border bg-card/95 p-3 backdrop-blur md:bottom-0">
        <div className="mx-auto flex max-w-xl gap-2">
          {step > 1 ? (
            <button type="button" onClick={back} className="btn btn-outline min-h-[52px]">
              Back
            </button>
          ) : null}
          {step < 3 ? (
            <button type="button" onClick={next} className="btn btn-primary min-h-[52px] flex-1" aria-disabled={step === 1 && !category}>
              {step === 1 ? 'Next: details' : 'Next: review'}
            </button>
          ) : (
            <button type="button" onClick={() => publish.mutate()} disabled={publish.isPending} className="btn btn-primary min-h-[52px] flex-1">
              {publish.isPending ? 'Sending…' : target ? 'Send request' : 'Post to nearby pros'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
