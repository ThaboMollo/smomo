'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        // `refresh` so the server components re-run and the middleware redirect applies.
        router.replace('/login');
        router.refresh();
      }}
      className="btn-console"
    >
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
