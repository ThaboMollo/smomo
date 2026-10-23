'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Field, Sparkle } from '@/components/ui';
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
        /invalid/i.test(err.message) ? 'That email and password don’t match. Check them and try again.' : err.message,
      );
      return;
    }
    router.push(next || '/app');
    router.refresh();
  };

  return (
    <div>
      <Sparkle size={36} className="text-primary" />
      <h1 className="mt-5 text-5xl">Welcome back</h1>
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
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger dark:bg-red-950" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" disabled={loading || !email || !password} className="btn btn-primary btn-block min-h-[52px]">
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-text-muted">
        New to Smomo?{' '}
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
