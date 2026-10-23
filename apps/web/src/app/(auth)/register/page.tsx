'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { toE164, validatePassport, validateSaId } from '@smomo/shared';

import { PasswordInput } from '@/components/PasswordInput';
import { Field, Sparkle, Steps } from '@/components/ui';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
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
  const [tried1, setTried1] = useState(false);
  const [tried2, setTried2] = useState(false);

  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get('next'));
  }, []);

  const idType = nationality === 'sa' ? 'sa_id' : 'passport';
  const idOk = useMemo(() => {
    if (!idNumber) return false;
    return idType === 'sa_id' ? validateSaId(idNumber).valid : validatePassport(idNumber);
  }, [idNumber, idType]);

  // Per-field errors, shown once the person has tried to continue.
  const e1 = {
    firstName: firstName.trim().length < 2 ? 'Enter your first name' : null,
    lastName: lastName.trim().length < 2 ? 'Enter your last name' : null,
    email: !EMAIL_RE.test(email.trim()) ? 'Enter a valid email address' : null,
    password: password.length < 6 ? 'Use at least 6 characters' : null,
  };
  const e2 = {
    mobile: !toE164(mobile) ? 'Enter a valid SA mobile number, e.g. 082 123 4567' : null,
    country: nationality === 'foreign' && !country.trim() ? 'Enter your country of origin' : null,
    idNumber: !idOk
      ? idType === 'sa_id'
        ? 'Enter a valid 13-digit SA ID number'
        : 'Enter a valid passport number'
      : null,
  };
  const step1Ok = Object.values(e1).every((v) => !v);
  const step2Ok = Object.values(e2).every((v) => !v);

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setTried1(true);
    if (!step1Ok) return;
    setError(undefined);
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried2(true);
    if (!step2Ok) return;
    const mob = toE164(mobile)!;

    setError(undefined);
    setLoading(true);
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signUp({ email: email.trim(), password });
    if (signErr) {
      setLoading(false);
      if (/registered|exists/i.test(signErr.message)) {
        setStep(1);
        setError('That email is already registered. Log in instead, or use another email.');
      } else {
        setError(signErr.message);
      }
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

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : '/login';

  return (
    <div>
      <Sparkle size={36} className="text-primary" />
      <h1 className="mt-5 text-5xl">{step === 1 ? 'Create your account' : 'Verify it’s you'}</h1>
      <p className="mt-3 text-text-muted">
        {step === 1
          ? 'Welcome to Smomo. It takes about a minute.'
          : 'We ask everyone for an ID number to keep Smomo safe. It’s never shown on your profile.'}
      </p>
      <div className="mt-6">
        <Steps step={step} total={2} label={step === 1 ? 'Account' : 'Verification'} />
      </div>
      <hr className="hr my-7" />

      {error ? (
        <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950" role="alert">
          {error}{' '}
          {/already registered/.test(error) ? (
            <Link href={loginHref} className="font-medium underline underline-offset-4">
              Log in
            </Link>
          ) : null}
        </p>
      ) : null}

      {step === 1 ? (
        <form onSubmit={goStep2} className="space-y-5" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" error={tried1 ? e1.firstName : null}>
              <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" aria-invalid={(tried1 && !!e1.firstName) || undefined} />
            </Field>
            <Field label="Last name" error={tried1 ? e1.lastName : null}>
              <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" aria-invalid={(tried1 && !!e1.lastName) || undefined} />
            </Field>
          </div>
          <Field label="Email" error={tried1 ? e1.email : null}>
            <input type="email" inputMode="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" aria-invalid={(tried1 && !!e1.email) || undefined} />
          </Field>
          <Field
            label="Create a password"
            error={tried1 ? e1.password : null}
            hint={password.length >= 6 ? <span className="text-success">✓ Looks good</span> : 'At least 6 characters'}
          >
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" invalid={tried1 && !!e1.password} />
          </Field>
          <button type="submit" className="btn btn-primary btn-block min-h-[52px]">
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label="Mobile number" error={tried2 ? e2.mobile : null} hint="Pros use this to reach you about a booking.">
            <input type="tel" inputMode="tel" className="input" value={mobile} onChange={(e) => setMobile(e.target.value)} autoComplete="tel" placeholder="082 123 4567" aria-invalid={(tried2 && !!e2.mobile) || undefined} />
          </Field>

          <div className="field">
            <span className="font-medium text-text">Nationality</span>
            <div role="radiogroup" aria-label="Nationality" className="segmented">
              {(
                [
                  ['sa', 'South African'],
                  ['foreign', 'Foreign national'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={nationality === v} onClick={() => setNationality(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {nationality === 'foreign' ? (
            <Field label="Country of origin" error={tried2 ? e2.country : null}>
              <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
            </Field>
          ) : null}

          <Field
            label={idType === 'sa_id' ? 'SA ID number' : 'Passport number'}
            error={tried2 ? e2.idNumber : null}
            hint={idOk ? <span className="text-success">✓ Valid</span> : idType === 'sa_id' ? '13 digits' : undefined}
          >
            <input
              className="input tnum"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              inputMode={idType === 'sa_id' ? 'numeric' : 'text'}
              maxLength={idType === 'sa_id' ? 13 : 20}
              aria-invalid={(tried2 && !!e2.idNumber) || undefined}
            />
          </Field>

          <Field label="Home address (optional)" hint="Helps pros who travel to you.">
            <input className="input" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} autoComplete="street-address" />
          </Field>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn btn-outline min-h-[52px]">
              Back
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary min-h-[52px] flex-1">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href={loginHref} className="font-medium text-primary-700 underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
