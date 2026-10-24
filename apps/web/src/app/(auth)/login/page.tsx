'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingOverlay } from '@/components/LoadingSpinner';
import { Field } from '@/components/ui';
import { PasswordInput } from '@/components/PasswordInput';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    setNext(new URLSearchParams(window.location.search).get('next'));
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(
        /invalid/i.test(err.message)
          ? 'That email and password don’t match. Check them and try again.'
          : /rate limit|too many/i.test(err.message)
            ? 'Too many attempts just now. Please wait a minute and try again.'
            : /confirm/i.test(err.message)
              ? 'Please confirm your email first. Check your inbox for the link.'
              : err.message,
      );
      return;
    }
    router.push(next || '/app');
    router.refresh();
  };

  return (
    <div>
      {loading ? <LoadingOverlay label="Logging in…" /> : null}
      <p className="kicker">Log in</p>
      <h1 className="mt-3 text-5xl">Welcome back</h1>
      <p className="mt-3 text-text-muted">
        {next?.startsWith('/app/request/new')
          ? 'Log in to send your request. We’ll bring you straight back to it.'
          : 'Log in to see your requests, offers and bookings.'}
      </p>
      <hr className="hr my-7" />
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field label="Email">
          <input
            type="email"
            required
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        {error ? (
          <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading || !email || !password} className="btn btn-primary btn-block min-h-[52px]">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        New to SMOMO?{' '}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="font-medium text-primary-700 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
