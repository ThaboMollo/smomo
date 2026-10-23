'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';

import { CATEGORIES, COUNTRIES, toE164, type ServiceCategory, type ServiceMode } from '@smomo/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { AddressField } from '@/components/location/AddressField';
import { Badge, Card, Field } from '@/components/ui';
import { api } from '@/lib/api';
import { useLocation } from '@/lib/use-location';
import { useMe } from '@/lib/use-me';

const inputCls = 'input';

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
        <h1 className="text-4xl sm:text-5xl">{p?.business_name ?? 'Your studio'}</h1>
        <div className="flex gap-2">
          <Badge tone={p?.verification_status === 'verified' ? 'success' : 'default'}>
            {p?.verification_status ?? 'unverified'}
          </Badge>
          <Badge tone={subActive ? 'primary' : 'default'}>{sub?.status ?? 'no plan'}</Badge>
        </div>
      </div>

      <Card className="flex items-center justify-between">
        <div>
          <p className="font-medium">{p?.is_online ? "You're online" : "You're offline"}</p>
          <p className="text-sm text-text-muted">Toggle availability for new requests.</p>
        </div>
        <button
          onClick={() => toggle.mutate(!p?.is_online)}
          disabled={!subActive || toggle.isPending}
          className={`btn ${p?.is_online ? 'btn-outline' : 'btn-primary'}`}
        >
          {p?.is_online ? 'Go offline' : 'Go online'}
        </button>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/app/studio/profile">
          <Card className="hover:bg-primary-100">Edit profile & socials →</Card>
        </Link>
        <Link href="/app/studio/services">
          <Card className="hover:bg-primary-100">Manage services →</Card>
        </Link>
        <Link href="/app/studio/portfolio">
          <Card className="hover:bg-primary-100">Manage portfolio →</Card>
        </Link>
        <Link href="/app/feed">
          <Card className="hover:bg-primary-100">View client requests →</Card>
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
  const [payshap, setPayshap] = useState('');
  const { place, setPlace } = useLocation();
  const [locErr, setLocErr] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const home = place?.country ?? 'ZA';

  const submit = useMutation({
    mutationFn: async () => {
      if (businessName.trim().length < 2) throw new Error('Enter your business name');
      if (!categories.length) throw new Error('Pick at least one service');
      if (!place) {
        setLocErr('Choose where you’re based so clients nearby can find you.');
        throw new Error('Choose where you’re based');
      }
      const proxy = toE164(payshap, home);
      if (!proxy) throw new Error('Enter a valid payment number');
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
        lat: place.lat,
        lng: place.lng,
        address: place.label,
      });
    },
    onSuccess: onDone,
    onError: (e: any) => setError(e?.message ?? 'Could not save'),
  });

  const toggleCat = (c: ServiceCategory) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const MODES: { value: ServiceMode; label: string }[] = [
    { value: 'studio', label: 'At my studio' },
    { value: 'mobile', label: 'I travel to clients' },
    { value: 'both', label: 'Both' },
  ];

  return (
    <div className="mx-auto max-w-xl">
      <p className="kicker">Studio setup</p>
      <h1 className="mt-3 text-4xl sm:text-5xl">Set up your studio</h1>
      <p className="mt-3 text-text-muted">
        Tell clients who you are and what you do. You can add services and portfolio photos next.
      </p>

      <form
        className="mt-8 space-y-6"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setError(undefined);
          submit.mutate();
        }}
      >
        <Field label="Business or display name">
          <input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" />
        </Field>
        <Field label="About you" hint="A short bio clients will see on your profile.">
          <textarea className={`${inputCls} min-h-24`} value={bio} onChange={(e) => setBio(e.target.value)} />
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-text">Services you offer</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.value} type="button" onClick={() => toggleCat(c.value)} aria-pressed={categories.includes(c.value)} className="chip min-h-[44px] px-4">
                <CategoryIcon category={c.value} size={16} />
                {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-text">Where you work</legend>
          <div role="radiogroup" aria-label="Where you work" className="segmented mt-2">
            {MODES.map((m) => (
              <button key={m.value} type="button" role="radio" aria-checked={serviceMode === m.value} onClick={() => setServiceMode(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </fieldset>

        {serviceMode !== 'studio' ? (
          <Field label="How far will you travel? (km)">
            <input className={inputCls} inputMode="numeric" value={radiusKm} onChange={(e) => setRadiusKm(e.target.value)} />
          </Field>
        ) : null}
        <AddressField
          label="Where are you based?"
          hint="Search for your studio or home address, or your suburb or town. Clients near here will find you."
          value={place}
          onChange={(p) => {
            setLocErr(null);
            setPlace(p);
          }}
          error={locErr}
        />
        <Field
          label={home === 'ZA' ? 'PayShap number' : 'Payment number'}
          hint={
            home === 'ZA'
              ? 'Clients pay you directly by PayShap to this number.'
              : 'The number clients pay you on. PayShap only works in South Africa, so agree the payment method with each client in chat.'
          }
        >
          <input className={inputCls} type="tel" inputMode="tel" placeholder={COUNTRIES[home].example} value={payshap} onChange={(e) => setPayshap(e.target.value)} />
        </Field>

        <div className="space-y-3">
          <label className="flex items-center gap-3 text-[0.9375rem] text-text">
            <input type="checkbox" className="h-5 w-5 accent-[var(--color-primary)]" checked={requiresDeposit} onChange={(e) => setRequiresDeposit(e.target.checked)} />
            Ask for a deposit to confirm bookings
          </label>
          {requiresDeposit ? (
            <Field label="Deposit (% of the price)">
              <input className={inputCls} inputMode="numeric" value={depositPct} onChange={(e) => setDepositPct(e.target.value)} />
            </Field>
          ) : null}
        </div>

        {error ? (
          <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={submit.isPending} className="btn btn-primary btn-block min-h-[52px]">
          {submit.isPending ? 'Saving…' : 'Save and go live'}
        </button>
        <p className="text-center text-sm text-text-muted">First 30 days free. Add your services and portfolio next.</p>
      </form>
    </div>
  );
}
