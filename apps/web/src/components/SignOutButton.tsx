'use client';

import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut();
        router.push('/');
        router.refresh();
      }}
      className="min-h-[44px] rounded-full px-3 text-sm font-medium text-text-muted transition-colors hover:bg-primary-100 hover:text-text"
    >
      Sign out
    </button>
  );
}
