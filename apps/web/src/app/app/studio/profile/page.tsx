'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import {
  CATEGORIES,
  SOCIAL_PLATFORMS,
  type ServiceCategory,
  type ServiceMode,
} from '@smomo/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

const inputCls = 'w-full rounded border border-border bg-card px-4 py-3';

export default function EditStudioProfile() {
  const me = useMe();
  const qc = useQueryClient();
  const p = me.data?.practitioner;

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!p) return <p className="text-text-muted">Set up your studio first.</p>;
  return <Form key={p.id} onSaved={() => qc.invalidateQueries({ queryKey: ['me'] })} />;
}

function Form({ onSaved }: { onSaved: () => void }) {
  const me = useMe();
  const p = me.data?.practitioner;

  const [businessName, setBusinessName] = useState(p?.business_name ?? '');
  const [bio, setBio] = useState(p?.bio ?? '');
  const [categories, setCategories] = useState<ServiceCategory[]>(p?.categories ?? []);
  const [serviceMode, setServiceMode] = useState<ServiceMode>(p?.service_mode ?? 'both');
  const [radiusKm, setRadiusKm] = useState(String(p?.travel_radius_km ?? 15));
  const [requiresDeposit, setRequiresDeposit] = useState(!!p?.requires_deposit);
  const [depositPct, setDepositPct] = useState(String(p?.deposit_percentage ?? 20));
  const [socials, setSocials] = useState<Record<string, string>>({
    instagram: p?.instagram ?? '',
    facebook: p?.facebook ?? '',
    x_handle: p?.x_handle ?? '',
    tiktok: p?.tiktok ?? '',
  });
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      if (businessName.trim().length < 2) throw new Error('Enter your business name');
      if (!categories.length) throw new Error('Pick at least one service');
      await api.practitioner.saveBusiness({
        businessName: businessName.trim(),
        bio: bio.trim() || undefined,
        categories,
        yearsExperience: p?.years_experience ?? null,
        serviceMode,
        travelRadiusKm: Number(radiusKm) || 15,
        requiresDeposit,
        depositPercentage: requiresDeposit ? Number(depositPct) || 0 : null,
        instagram: socials.instagram || null,
        facebook: socials.facebook || null,
        tiktok: socials.tiktok || null,
        xHandle: socials.x_handle || null,
      });
    },
    onSuccess: () => {
      setSaved(true);
      onSaved();
    },
    onError: (e: any) => setError(e?.message ?? 'Could not save'),
  });

  const toggleCat = (c: ServiceCategory) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl">Edit studio profile</h1>
        <Link href="/app/studio" className="text-sm text-text-muted hover:text-text">
          ← Back
        </Link>
      </div>

      <div className="space-y-3">
        <input placeholder="Business / display name" className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        <textarea placeholder="Bio" className={`${inputCls} min-h-20`} value={bio} onChange={(e) => setBio(e.target.value)} />

        <p className="pt-1 text-sm font-medium text-text-muted">Services you offer</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => toggleCat(c.value)} className={`rounded border px-3 py-1.5 text-sm ${categories.includes(c.value) ? 'border-primary bg-primary-100 text-primary-700' : 'border-border bg-card'}`}>
              <span className="inline-flex items-center gap-1.5"><CategoryIcon category={c.value} size={14} />{c.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['studio', 'mobile', 'both'] as ServiceMode[]).map((m) => (
            <button key={m} onClick={() => setServiceMode(m)} className={`flex-1 rounded border px-3 py-2 text-sm capitalize ${serviceMode === m ? 'border-primary bg-primary-100 text-primary-700' : 'border-border bg-card'}`}>
              {m}
            </button>
          ))}
        </div>
        {serviceMode !== 'studio' ? (
          <input placeholder="Travel radius (km)" inputMode="numeric" className={inputCls} value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
        ) : null}
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={requiresDeposit} onChange={(e) => setRequiresDeposit(e.target.checked)} />
          Require a deposit to confirm bookings
        </label>
        {requiresDeposit ? (
          <input placeholder="Deposit %" inputMode="numeric" className={inputCls} value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
        ) : null}

        {/* Social media handles */}
        <p className="pt-2 text-sm font-medium text-text-muted">Social media</p>
        <p className="-mt-1 text-xs text-text-faint">
          Add your usernames so clients can see your work elsewhere. Just the handle — no @ or link.
        </p>
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform.key} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-sm text-text-muted">{platform.label}</span>
            <div className="flex flex-1 items-center rounded border border-border bg-card">
              <span className="pl-3 text-sm text-text-faint">@</span>
              <input
                placeholder={platform.placeholder}
                className="w-full bg-transparent px-2 py-3 outline-none"
                value={socials[platform.key] ?? ''}
                onChange={(e) => {
                  setSaved(false);
                  setSocials((s) => ({ ...s, [platform.key]: e.target.value }));
                }}
              />
            </div>
          </div>
        ))}

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {saved ? <p className="text-sm text-success">Saved.</p> : null}
        <button onClick={() => save.mutate()} disabled={save.isPending} className="w-full rounded border border-primary py-3 font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50">
          {save.isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
