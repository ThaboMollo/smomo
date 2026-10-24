'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { SmomoMark } from '@/components/SmomoMark';
import { createClient } from '@/lib/supabase/client';

/**
 * Console sign-in. Same credentials as the rest of SMOMO — one account, several surfaces —
 * so there is deliberately no sign-up here: professionals register in the app and arrive
 * with a link, and staff accounts are granted, not self-served.
 */
function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  /**
   * Where to land after signing in. `useSearchParams` reads it during render rather than
   * copying it into state inside an effect, and the value is only ever used at submit
   * time. Only an in-app path is accepted, so a crafted `?next=//evil.example` or
   * `?next=https://…` cannot turn the sign-in form into an open redirect.
   */
  const params = useSearchParams();
  const requested = params.get('next');
  const next = requested && requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    const { error: err } = await createClient().auth.signInWithPassword({ email, password });
    if (err) {
      setLoading(false);
      setError(
        /invalid/i.test(err.message)
          ? 'That email and password don’t match.'
          : /rate limit|too many/i.test(err.message)
            ? 'Too many attempts. Wait a minute and try again.'
            : err.message,
      );
      return;
    }
    router.replace(next);
    router.refresh();
  };

  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-text">
          <SmomoMark className="h-7" />
          <span className="smomo-wordmark text-2xl">smomo</span>
          <span className="ml-0.5 rounded-md border border-border px-1.5 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Console
          </span>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h1 className="panel-title">Sign in</h1>
          </div>
          <form onSubmit={onSubmit} className="panel-body space-y-4" noValidate>
            <label className="field">
              <span className="font-medium text-text">Email</span>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                autoFocus
              />
            </label>
            <label className="field">
              <span className="font-medium text-text">Password</span>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-console btn-console-primary w-full"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-text-muted">
          Professionals: use the same details you registered with in the SMOMO app.
        </p>
      </div>
    </main>
  );
}

/**
 * `useSearchParams` opts a route out of prerendering unless it sits behind a Suspense
 * boundary, so the form is split out and the shell around it stays static. The fallback is
 * the same panel with the button disabled, so there is no layout shift when it swaps in.
 */
export default function Login() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-dvh place-items-center bg-bg px-4 py-10">
          <div className="w-full max-w-sm">
            <div className="panel">
              <div className="panel-head">
                <h1 className="panel-title">Sign in</h1>
              </div>
              <div className="panel-body">
                <p className="text-sm text-text-muted">Loading…</p>
              </div>
            </div>
          </div>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
