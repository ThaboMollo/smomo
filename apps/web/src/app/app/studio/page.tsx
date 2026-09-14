'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CATEGORIES, toE164, type ServiceCategory, type ServiceMode } from '@smomo/shared';

import { Badge, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

const inputCls = 'w-full rounded-xl border border-border bg-card px-4 py-3';
const CAPE_TOWN = { latitude: -33.9249, longitude: 18.4241 };

export default function Studio() {
  const me = useMe();
  const qc = useQueryClient();

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;
  if (me.data?.profile?.is_practitioner) return <StudioOverview onChange={() => qc.invalidateQueries({ queryKey: ['me'] })} />;
  return <BecomeProvider onDone={() => qc.invalidateQueries({ queryKey: ['me'] })} />;
}

function StudioOverview({ onChange }: { onChange: () => void }) {
  const me = useMe();
  const p = me.data?.practitioner;
  const sub = me.data?.subscription;
  const subActive = sub?.status === 'trialing' || sub?.status === 'active';
  const toggle = useMutation({
    mutationFn: (isOnline: boolean) => api.practitioner.toggleOnline(isOnline),
    onSuccess: onChange,
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{p?.business_name ?? 'Your studio'}</h1>
        <div className="flex gap-2">
          <Badge tone={p?.verification_status === 'verified' ? 'success' : 'default'}>
            {p?.verification_status ?? 'unverified'}
          </Badge>
          <Badge tone={subActive ? 'primary' : 'default'}>{sub?.status ?? 'no plan'}</Badge>
        </div>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="font-semibold">{p?.is_online ? "You're online" : "You're offline"}</p>
          <p className="text-sm text-text-muted">Toggle availability for new requests.</p>
        </div>
        <button
          onClick={() => toggle.mutate(!p?.is_online)}
          disabled={!subActive || toggle.isPending}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${p?.is_online ? 'bg-card-muted text-text' : 'bg-primary text-white'} disabled:opacity-50`}
        >
          {p?.is_online ? 'Go offline' : 'Go online'}
        </button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/app/studio/services">
          <Card className="hover:shadow-md">Manage services →</Card>
        </Link>
        <Link href="/app/studio/portfolio">
          <Card className="hover:shadow-md">Manage portfolio →</Card>
        </Link>
        <Link href="/app/feed">
          <Card className="hover:shadow-md">View client requests →</Card>
        </Link>
      </div>
    </div>
  );
}

function BecomeProvider({ onDone }: { onDone: () => void }) {
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [serviceMode, setServiceMode] = useState<ServiceMode>('both');
  const [radiusKm, setRadiusKm] = useState('15');
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositPct, setDepositPct] = useState('20');
  const [workAddress, setWorkAddress] = useState('');
  const [payshap, setPayshap] = useState('');
  const [coords, setCoords] = useState(CAPE_TOWN);
  const [error, setError] = useState<string>();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setCoords(CAPE_TOWN),
    );
  }, []);

  const submit = useMutation({
    mutationFn: async () => {
      if (businessName.trim().length < 2) throw new Error('Enter your business name');
      if (!categories.length) throw new Error('Pick at least one service');
      const proxy = toE164(payshap);
      if (!proxy) throw new Error('Enter a valid PayShap number');
      await api.practitioner.saveBusiness({
        businessName: businessName.trim(),
        bio: bio.trim() || undefined,
        categories,
        serviceMode,
        travelRadiusKm: Number(radiusKm) || 15,
        requiresDeposit,
        depositPercentage: requiresDeposit ? Number(depositPct) || 0 : null,
      });
      await api.practitioner.finalize({
        payshapProxy: proxy,
        lat: coords.latitude,
        lng: coords.longitude,
        address: workAddress.trim() || null,
      });
    },
    onSuccess: onDone,
    onError: (e: any) => setError(e?.message ?? 'Could not save'),
  });

  const toggleCat = (c: ServiceCategory) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Become a provider</h1>
      <div className="mt-6 space-y-3">
        <input placeholder="Business / display name" className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
        <textarea placeholder="Bio" className={`${inputCls} min-h-20`} value={bio} onChange={(e) => setBio(e.target.value)} />
        <p className="text-sm font-semibold text-text-muted">Services you offer</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => toggleCat(c.value)} className={`rounded-full border px-3 py-1.5 text-sm ${categories.includes(c.value) ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['studio', 'mobile', 'both'] as ServiceMode[]).map((m) => (
            <button key={m} onClick={() => setServiceMode(m)} className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize ${serviceMode === m ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}>
              {m}
            </button>
          ))}
        </div>
        {serviceMode !== 'studio' ? (
          <input placeholder="Travel radius (km)" inputMode="numeric" className={inputCls} value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
        ) : null}
        <input placeholder="Work address (studio / base)" className={inputCls} value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} />
        <input placeholder="PayShap number" className={inputCls} value={payshap} onChange={(e) => setPayshap(e.target.value)} />
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input type="checkbox" checked={requiresDeposit} onChange={(e) => setRequiresDeposit(e.target.checked)} />
          Require a deposit to confirm bookings
        </label>
        {requiresDeposit ? (
          <input placeholder="Deposit %" inputMode="numeric" className={inputCls} value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
        ) : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full rounded-xl bg-primary py-3 font-semibold text-white disabled:opacity-50">
          {submit.isPending ? 'Saving…' : 'Save & go live'}
        </button>
        <p className="text-center text-xs text-text-faint">First 30 days free. Add services & portfolio next.</p>
      </div>
    </div>
  );
}
