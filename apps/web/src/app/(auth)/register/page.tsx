'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { toE164, validatePassport, validateSaId } from '@smomo/shared';

import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const inputCls = 'w-full rounded-xl border border-border bg-card px-4 py-3';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState<'sa' | 'foreign'>('sa');
  const [country, setCountry] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get('next'));
  }, []);

  const idType = nationality === 'sa' ? 'sa_id' : 'passport';
  const idOk = useMemo(() => {
    if (!idNumber) return false;
    return idType === 'sa_id' ? validateSaId(idNumber).valid : validatePassport(idNumber);
  }, [idNumber, idType]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim().length < 2 || lastName.trim().length < 2) return setError('Enter your name');
    if (nationality === 'foreign' && !country.trim()) return setError('Enter your country of origin');
    if (!idOk) return setError('Enter a valid ID / passport number');
    const mob = toE164(mobile);
    if (!mob) return setError('Enter a valid mobile number');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setError(undefined);
    setLoading(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signUp({ email: email.trim(), password });
    if (signErr) {
      setLoading(false);
      setError(
        /registered|exists/i.test(signErr.message)
          ? 'That email is already registered. Please log in.'
          : signErr.message,
      );
      return;
    }
    try {
      await api.me.updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        full_name: `${firstName} ${lastName}`.trim(),
        phone: mob,
        home_address: homeAddress.trim() || null,
      });
      await api.me.submitIdentity({
        idType,
        idNumber: idNumber.trim(),
        idCountry: nationality === 'foreign' ? country.trim() : 'South Africa',
      });
      router.push(next || '/app');
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Could not complete registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h1 className="text-2xl font-bold">Create your account</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="First name" className={inputCls} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <input placeholder="Last name" className={inputCls} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setNationality('sa')} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${nationality === 'sa' ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}>
            South African
          </button>
          <button type="button" onClick={() => setNationality('foreign')} className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium ${nationality === 'foreign' ? 'border-primary bg-primary text-white' : 'border-border bg-card'}`}>
            Foreign national
          </button>
        </div>
        {nationality === 'foreign' ? (
          <input placeholder="Country of origin" className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} />
        ) : null}
        {nationality === 'sa' || country ? (
          <input placeholder={idType === 'sa_id' ? 'SA ID number (13 digits)' : 'Passport number'} className={inputCls} value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
        ) : null}
        <input placeholder="Home address" className={inputCls} value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} />
        <input placeholder="Mobile number" className={inputCls} value={mobile} onChange={(e) => setMobile(e.target.value)} />
        <input type="email" placeholder="Email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        <input type="password" placeholder="Password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-dark disabled:opacity-50">
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="font-semibold text-primary"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
