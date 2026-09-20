'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
      setError(err.message);
      return;
    }
    router.push(next || '/app');
    router.refresh();
  };

  return (
    <div className="rounded border border-border bg-card p-6">
      <h1 className="text-2xl">Log in</h1>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full rounded border border-border bg-card px-4 py-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded border border-border bg-card px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded border border-primary hover:bg-primary-100 py-3 font-medium text-primary-700 active:bg-primary-200 disabled:opacity-50"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-text-muted">
        New here?{' '}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : '/register'}
          className="font-medium text-primary-700"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
