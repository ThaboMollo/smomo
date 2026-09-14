'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { BOOKING_MODE_LABEL, CATEGORIES, type BookingMode, type ServiceCategory } from '@smomo/shared';

import { Button } from '@/components/ui';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const inputCls = 'w-full rounded-xl border border-border bg-card px-4 py-3';
const CAPE_TOWN = { latitude: -33.9249, longitude: 18.4241 };

export default function NewRequest() {
  const router = useRouter();
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [mode, setMode] = useState<BookingMode>('mobile');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState(CAPE_TOWN);
  const [error, setError] = useState<string>();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setCoords(CAPE_TOWN),
    );
  }, []);

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
        consent,
        expiresMinutes: 30,
      });
      return res.id;
    },
    onSuccess: (id) => router.push(`/app/request/${id}`),
    onError: (e: any) => setError(e?.message ?? 'Could not post request'),
  });

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Post a request</h1>

      <p className="mt-6 mb-2 text-sm font-semibold text-text-muted">What do you need?</p>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${category === c.value ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <p className="mt-6 mb-2 text-sm font-semibold text-text-muted">Where?</p>
      <div className="flex gap-2">
        {(['mobile', 'studio'] as BookingMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${mode === m ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}
          >
            {BOOKING_MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        <input placeholder="Address / area" className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} />
        <textarea placeholder="Details (optional)" className={`${inputCls} min-h-24`} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Budget min (R)" inputMode="numeric" className={inputCls} value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
          <input placeholder="Budget max (R)" inputMode="numeric" className={inputCls} value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
        </div>
        <label className="block text-sm text-text-muted">
          Reference photo (optional)
          <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          I'm happy for a photo of the finished work to appear in the pro's public portfolio.
        </label>
      </div>

      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

      <button
        onClick={() => publish.mutate()}
        disabled={publish.isPending}
        className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {publish.isPending ? 'Posting…' : 'Post to nearby pros'}
      </button>
    </div>
  );
}
