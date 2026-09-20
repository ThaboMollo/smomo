'use client';

import { faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { toE164 } from '@smomo/shared';

import { Icon } from '@/components/Icon';
import { Avatar, Card, Stars } from '@/components/ui';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/upload';
import { useMe } from '@/lib/use-me';

const inputCls = 'w-full rounded border border-border bg-card px-4 py-3';

export default function Profile() {
  const me = useMe();
  const qc = useQueryClient();
  const router = useRouter();
  const profile = me.data?.profile;
  const isPractitioner = !!profile?.is_practitioner;
  const isAdmin = !!profile?.is_admin;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  // Hydrate the form once the profile loads.
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? '');
    setLastName(profile.last_name ?? '');
    setPhone(profile.phone ?? '');
    setWhatsapp(profile.whatsapp_number ?? '');
    setHomeAddress(profile.home_address ?? '');
  }, [profile]);

  const refresh = () => qc.invalidateQueries({ queryKey: ['me'] });

  const save = useMutation({
    mutationFn: () => {
      const mob = toE164(phone);
      if (!mob) throw new Error('Enter a valid mobile number');
      return api.me.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName} ${lastName}`.trim(),
        phone: mob,
        whatsapp_number: whatsapp.trim() ? toE164(whatsapp) : null,
        home_address: homeAddress.trim() || null,
      });
    },
    onSuccess: () => {
      setSaved(true);
      setError(undefined);
      refresh();
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e: any) => setError(e?.message ?? 'Could not save'),
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadImage('avatars', file);
      await api.me.updateProfile({ avatar_url: url });
    },
    onSuccess: refresh,
    onError: (e: any) => setError(e?.message ?? 'Upload failed'),
  });

  const signOut = async () => {
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (me.isLoading) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-xl space-y-8">
      {/* Identity */}
      <div className="flex flex-col items-center gap-2">
        <label className="relative cursor-pointer">
          <Avatar name={profile?.full_name ?? null} size={88} />
          <input
            type="file"
            accept="image/*"
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={uploadAvatar.isPending}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar.mutate(f);
              e.target.value = '';
            }}
          />
          <span className="absolute -bottom-1 -right-1 rounded border border-primary-300 bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
            {uploadAvatar.isPending ? '…' : 'Edit'}
          </span>
        </label>
        <h1 className="text-xl">{profile?.full_name ?? 'Your profile'}</h1>
        {profile?.client_rating != null ? (
          <Stars rating={profile.client_rating} count={profile.client_rating_count ?? undefined} />
        ) : null}
      </div>

      {/* Become / switch to provider */}
      <Link href="/app/studio">
        <Card className="flex items-center justify-between border-primary-300 bg-primary-100 transition-colors hover:bg-primary-200">
          <div>
            <p className="font-medium text-primary-700">{isPractitioner ? 'Your studio' : 'Become a provider'}</p>
            <p className="text-sm text-text-muted">
              {isPractitioner ? 'Manage services, portfolio & availability.' : 'Offer your services and earn on Smomo.'}
            </p>
          </div>
          <Icon icon={faBriefcase} size={22} />
        </Card>
      </Link>

      {/* Edit details */}
      <Card className="space-y-3">
        <p className="font-medium">Your details</p>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="First name" className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder="Last name" className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <input placeholder="Mobile number" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <input placeholder="WhatsApp (optional)" className={inputCls} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        <input placeholder="Home address (optional)" className={inputCls} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="w-full rounded border border-primary hover:bg-primary-100 py-3 font-medium text-primary-700 active:bg-primary-200 disabled:opacity-50"
        >
          {save.isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </Card>

      {isAdmin ? (
        <Link href="/app/admin" className="block text-center font-medium text-primary-700">
          Admin dashboard →
        </Link>
      ) : null}

      <button
        onClick={signOut}
        className="w-full rounded border border-border py-3 text-sm font-medium text-text-muted hover:bg-card-muted"
      >
        Sign out
      </button>
    </div>
  );
}
