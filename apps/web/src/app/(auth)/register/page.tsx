'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ApiError } from '@smomo/api-client';
import { COUNTRIES, COUNTRY_LIST, normalizeIdNumber, toE164, validatePassport, validateSaId, type CountryCode } from '@smomo/shared';

import { LoadingOverlay } from '@/components/LoadingSpinner';
import { AddressField } from '@/components/location/AddressField';
import { PasswordInput } from '@/components/PasswordInput';
import { PhoneInput } from '@/components/PhoneInput';
import { CheckIcon, Field, Steps } from '@/components/ui';
import { api } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRO_NEXT = '/app/studio';

type Role = 'client' | 'pro';

/** Turns a Supabase auth error into something a person can act on. */
function friendlyAuthError(message: string): string {
  if (/password/i.test(message)) return message;
  if (/rate limit|too many/i.test(message)) return 'Too many attempts just now. Please wait a minute and try again.';
  if (/invalid.*email|email.*invalid/i.test(message)) return 'That email address doesn’t look right. Check it and try again.';
  if (/signups? (are )?(not allowed|disabled)/i.test(message)) return 'Sign-ups are paused right now. Please try again later.';
  return message;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState<'sa' | 'foreign'>('sa');
  const [origin, setOrigin] = useState<CountryCode | 'other'>('LS');
  const [country, setCountry] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('ZA');
  const [idNumber, setIdNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [homeText, setHomeText] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [serverErrors, setServerErrors] = useState<{ mobile?: string; idNumber?: string }>({});
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [tried1, setTried1] = useState(false);
  const [tried2, setTried2] = useState(false);
  // The email an account has already been created (or signed in) for during this visit.
  // Lets a retry after a failed profile save continue instead of signing up again.
  const [readyEmail, setReadyEmail] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const n = q.get('next');
    const asPro = q.get('as') === 'pro' || !!n?.startsWith(PRO_NEXT);
    setNext(n);
    if (asPro) setRole('pro');

    // Someone who is already signed in and fully registered doesn't need this page.
    (async () => {
      const { data } = await createClient().auth.getSession();
      if (!data.session) return;
      try {
        const me = await api.me.get();
        if (me.profile?.phone) router.replace(n || (asPro ? PRO_NEXT : '/app'));
      } catch {
        /* not reachable or not signed in: just show the form */
      }
    })();
  }, [router]);

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
    mobile: !toE164(mobile, phoneCountry)
      ? `Enter a valid ${COUNTRIES[phoneCountry].name} mobile number, e.g. ${COUNTRIES[phoneCountry].example}`
      : null,
    country: nationality === 'foreign' && origin === 'other' && !country.trim() ? 'Enter your country' : null,
    idNumber: !idOk
      ? idType === 'sa_id'
        ? 'Enter a valid 13-digit SA ID number'
        : 'Enter a valid passport or national ID number'
      : null,
  };
  const step1Ok = Object.values(e1).every((v) => !v);
  const step2Ok = Object.values(e2).every((v) => !v);

  const destination = next || (role === 'pro' ? PRO_NEXT : '/app');

  const goStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setTried1(true);
    if (!step1Ok) return;
    setError(undefined);
    setStep(2);
  };

  /** Creates the account, or continues one a previous attempt already created. */
  const ensureAccount = async (): Promise<boolean> => {
    const addr = email.trim();
    if (readyEmail === addr) return true;
    const supabase = createClient();

    // A different person may still be signed in on this device; never write to their profile.
    await supabase.auth.signOut();

    const { data, error: signErr } = await supabase.auth.signUp({ email: addr, password });
    if (!signErr) {
      if (!data.session) {
        setStep(1);
        setError('Almost there: we’ve emailed you a link to confirm your address. Open it, then log in to finish.');
        return false;
      }
      setReadyEmail(addr);
      return true;
    }

    if (/registered|exists/i.test(signErr.message)) {
      // Most likely an earlier attempt created the account but stopped before saving the profile.
      // If the password matches, carry on from where it stopped.
      const { error: inErr } = await supabase.auth.signInWithPassword({ email: addr, password });
      if (!inErr) {
        setReadyEmail(addr);
        return true;
      }
      setStep(1);
      setError('That email already has an account, and the password doesn’t match it.');
      return false;
    }

    if (/password/i.test(signErr.message)) setStep(1);
    setError(friendlyAuthError(signErr.message));
    return false;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried2(true);
    if (!step2Ok) return;
    const mob = toE164(mobile, phoneCountry)!;

    setError(undefined);
    setServerErrors({});
    setLoading(true);
    try {
      if (!(await ensureAccount())) return;

      try {
        await api.me.updateProfile({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: mob,
          home_address: (homeAddress || homeText).trim() || null,
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setServerErrors({ mobile: err.message });
          setError('Your account is created, but we couldn’t save that mobile number. Change it below and continue.');
          return;
        }
        throw err;
      }

      try {
        await api.me.submitIdentity({
          idType,
          idNumber: idType === 'sa_id' ? idNumber.replace(/\D/g, '') : normalizeIdNumber(idNumber),
          idCountry: nationality === 'foreign' ? (origin === 'other' ? country.trim() : COUNTRIES[origin].name) : 'South Africa',
        });
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          setServerErrors({ idNumber: err.message });
          setError('Your account is created, but that ID number is already linked to another account.');
          return;
        }
        throw err;
      }

      router.push(destination);
      router.refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 401
            ? 'Your session expired. Please log in to finish setting up your account.'
            : err.message
          : 'We couldn’t reach SMOMO. Check your connection and try again. Your details are still here.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loginHref = `/login?next=${encodeURIComponent(destination)}`;

  return (
    <div>
      {loading ? <LoadingOverlay label="Creating your account…" /> : null}
      <p className="kicker">{role === 'pro' ? 'Join as a pro' : 'Join SMOMO'}</p>
      <h1 className="mt-3 text-5xl">{step === 1 ? 'Create your account' : 'Verify it’s you'}</h1>
      <p className="mt-3 text-text-muted">
        {step === 1
          ? role === 'pro'
            ? 'Set up your account, then build your studio. It takes about a minute.'
            : 'It takes about a minute.'
          : 'We ask everyone for an ID number. It’s never shown on your profile.'}
      </p>
      <div className="mt-6">
        <Steps step={step} total={2} label={step === 1 ? 'Account' : 'Verification'} />
      </div>
      <hr className="hr my-7" />

      {error ? (
        <p className="mb-5 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {error}{' '}
          {/already has an account/.test(error) ? (
            <Link href={loginHref} className="font-medium underline underline-offset-4">
              Log in
            </Link>
          ) : null}
        </p>
      ) : null}

      {step === 1 ? (
        <form onSubmit={goStep2} className="space-y-5" noValidate>
          <div className="field">
            <span className="font-medium text-text">I’m joining as</span>
            <div role="radiogroup" aria-label="I’m joining as" className="segmented">
              {(
                [
                  ['client', 'Looking for a pro'],
                  ['pro', 'A beauty pro'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={role === v} onClick={() => setRole(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
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
            hint={
              password.length >= 6 ? (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <CheckIcon size={14} /> Looks good
                </span>
              ) : (
                'At least 6 characters'
              )
            }
          >
            <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" invalid={tried1 && !!e1.password} />
          </Field>
          <button type="submit" className="btn btn-primary btn-block min-h-[52px]">
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <Field label="Mobile number" error={serverErrors.mobile ?? (tried2 ? e2.mobile : null)} hint="Pros use this to reach you about a booking.">
            <PhoneInput
              country={phoneCountry}
              onCountryChange={setPhoneCountry}
              value={mobile}
              onChange={(v) => {
                setMobile(v);
                setServerErrors((x) => ({ ...x, mobile: undefined }));
              }}
              invalid={!!serverErrors.mobile || (tried2 && !!e2.mobile)}
            />
          </Field>

          <div className="field">
            <span className="font-medium text-text">Nationality</span>
            <div role="radiogroup" aria-label="Nationality" className="segmented">
              {(
                [
                  ['sa', 'South African'],
                  ['foreign', 'From another country'],
                ] as const
              ).map(([v, l]) => (
                <button key={v} type="button" role="radio" aria-checked={nationality === v} onClick={() => {
                    setNationality(v);
                    // Default the phone code to the person's country (they can still change it).
                    setPhoneCountry(v === 'sa' ? 'ZA' : origin === 'other' ? phoneCountry : origin);
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {nationality === 'foreign' ? (
            <>
              <Field label="Country">
                <select
                  className="input cursor-pointer"
                  value={origin}
                  onChange={(e) => {
                    const v = e.target.value as CountryCode | 'other';
                    setOrigin(v);
                    if (v !== 'other') setPhoneCountry(v);
                  }}
                >
                  {COUNTRY_LIST.filter((c) => c.code !== 'ZA').map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name}
                    </option>
                  ))}
                  <option value="other">Another country</option>
                </select>
              </Field>
              {origin === 'other' ? (
                <Field label="Which country?" error={tried2 ? e2.country : null}>
                  <input className="input" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" />
                </Field>
              ) : null}
            </>
          ) : null}

          <Field
            label={idType === 'sa_id' ? 'SA ID number' : 'Passport or national ID number'}
            error={serverErrors.idNumber ?? (tried2 ? e2.idNumber : null)}
            hint={
              idOk ? (
                <span className="inline-flex items-center gap-1.5 text-success">
                  <CheckIcon size={14} /> Looks right
                </span>
              ) : idType === 'sa_id' ? (
                '13 digits. Spaces are fine.'
              ) : (
                'Letters and numbers. Spaces and dashes are fine.'
              )
            }
          >
            <input
              className="input tnum"
              value={idNumber}
              onChange={(e) => {
                setIdNumber(e.target.value);
                setServerErrors((s) => ({ ...s, idNumber: undefined }));
              }}
              inputMode={idType === 'sa_id' ? 'numeric' : 'text'}
              maxLength={idType === 'sa_id' ? 17 : 20}
              autoComplete="off"
              aria-invalid={(!!serverErrors.idNumber || (tried2 && !!e2.idNumber)) || undefined}
            />
          </Field>

          <AddressField
            label="Home address (optional)"
            hint="Helps pros who travel to you."
            value={null}
            initialText={homeText}
            showMap={false}
            onText={setHomeText}
            onChange={(p) => setHomeAddress(p?.label ?? '')}
          />

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} disabled={loading} className="btn btn-outline min-h-[52px]">
              Back
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary min-h-[52px] flex-1">
              {loading ? 'Creating account…' : readyEmail ? 'Save and continue' : 'Create account'}
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
