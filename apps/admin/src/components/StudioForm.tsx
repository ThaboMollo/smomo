'use client';

import { useState, useTransition } from 'react';

import { CATEGORIES, SERVICE_MODE_LABEL, type ServiceCategory, type ServiceMode } from '@smomo/shared';

import { saveStudio } from '@/app/(console)/studio/actions';

export type StudioInitial = {
  businessName: string;
  bio: string;
  categories: ServiceCategory[];
  serviceMode: ServiceMode;
  travelRadiusKm: number;
  yearsExperience: number | null;
  requiresDeposit: boolean;
  depositPercentage: number | null;
  instagram: string;
  facebook: string;
  tiktok: string;
  xHandle: string;
};

/**
 * The business profile form.
 *
 * Uncontrolled inputs with `defaultValue`, so the server's saved values are the source of
 * truth and a revalidate after saving shows what was actually stored rather than what was
 * typed. Only the three fields that drive conditional rendering — mode, categories and the
 * deposit switch — are held in state.
 */
export function StudioForm({ initial }: { initial: StudioInitial }) {
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<ServiceMode>(initial.serviceMode);
  const [cats, setCats] = useState<ServiceCategory[]>(initial.categories);
  const [deposit, setDeposit] = useState(initial.requiresDeposit);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const toggleCat = (c: ServiceCategory) =>
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <form
      className="panel"
      action={(data) => {
        setError(undefined);
        setSaved(false);
        // The chips are buttons, not inputs, so the chosen categories are appended here.
        for (const c of cats) data.append('categories', c);
        data.set('serviceMode', mode);
        startTransition(async () => {
          const result = await saveStudio(data);
          if (result.ok) setSaved(true);
          else setError(result.error);
        });
      }}
    >
      <div className="panel-head">
        <h2 className="panel-title">Business profile</h2>
        {saved ? <span className="text-xs text-success">Saved</span> : null}
      </div>

      <div className="panel-body space-y-4">
        <label className="field">
          <span className="font-medium text-text">Business name</span>
          <input name="businessName" className="input" defaultValue={initial.businessName} required minLength={2} maxLength={120} />
        </label>

        <label className="field">
          <span className="font-medium text-text">About your work</span>
          <textarea name="bio" className="input min-h-24" defaultValue={initial.bio} maxLength={1000} placeholder="What you do, what makes your work yours" />
        </label>

        <fieldset className="field">
          <legend className="font-medium text-text">Categories</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className="chip"
                aria-pressed={cats.includes(c.value)}
                onClick={() => toggleCat(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>
          {cats.length === 0 ? (
            <span className="text-xs text-danger">Pick at least one.</span>
          ) : null}
        </fieldset>

        <fieldset className="field">
          <legend className="font-medium text-text">How you work</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {(['studio', 'mobile', 'both'] as ServiceMode[]).map((m) => (
              <button
                key={m}
                type="button"
                className="chip"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {SERVICE_MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          {mode !== 'studio' ? (
            <label className="field">
              <span className="font-medium text-text">How far will you travel? (km)</span>
              <input name="travelRadiusKm" className="input tnum" inputMode="numeric" defaultValue={initial.travelRadiusKm} />
            </label>
          ) : (
            // Studio-only pros still need a value: travel_radius_km is NOT NULL.
            <input type="hidden" name="travelRadiusKm" value={initial.travelRadiusKm || 15} />
          )}
          <label className="field">
            <span className="font-medium text-text">Years of experience</span>
            <input
              name="yearsExperience"
              className="input tnum"
              inputMode="numeric"
              defaultValue={initial.yearsExperience ?? ''}
              placeholder="Optional"
            />
          </label>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2.5 text-sm">
            <input
              type="checkbox"
              name="requiresDeposit"
              checked={deposit}
              onChange={(e) => setDeposit(e.target.checked)}
              className="size-4 accent-[var(--color-primary)]"
            />
            <span className="font-medium text-text">Require a deposit</span>
          </label>
          {deposit ? (
            <label className="field max-w-40">
              <span className="text-xs font-medium text-text">Deposit %</span>
              <input
                name="depositPercentage"
                className="input tnum"
                inputMode="numeric"
                defaultValue={initial.depositPercentage ?? 20}
              />
            </label>
          ) : null}
        </div>

        <fieldset className="field">
          <legend className="font-medium text-text">Social handles</legend>
          <p className="text-xs text-text-muted">Username only, no link.</p>
          <div className="mt-1 grid gap-3 sm:grid-cols-2">
            {([
              ['instagram', 'Instagram', initial.instagram],
              ['facebook', 'Facebook', initial.facebook],
              ['tiktok', 'TikTok', initial.tiktok],
              ['xHandle', 'X', initial.xHandle],
            ] as const).map(([name, label, value]) => (
              <label key={name} className="field">
                <span className="text-xs font-medium text-text">{label}</span>
                <input name={name} className="input" defaultValue={value} maxLength={50} placeholder="Optional" />
              </label>
            ))}
          </div>
        </fieldset>

        {error ? (
          <p className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn-console btn-console-primary" disabled={pending || cats.length === 0}>
          {pending ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
