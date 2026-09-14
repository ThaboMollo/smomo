'use client';

import Link from 'next/link';

import { Container } from '@/components/ui';
import { SignOutButton } from '@/components/SignOutButton';
import { useMe } from '@/lib/use-me';

export function AppNav() {
  const { data } = useMe();
  const isPractitioner = !!data?.profile?.is_practitioner;
  const isAdmin = !!data?.profile?.is_admin;

  return (
    <div className="border-b border-border bg-card">
      <Container className="flex h-14 items-center justify-between">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/app" className="font-extrabold">
            💅 Smomo
          </Link>
          <Link href="/app" className="text-text-muted hover:text-text">
            Dashboard
          </Link>
          <Link href="/app/request/new" className="text-text-muted hover:text-text">
            Post a request
          </Link>
          <Link href="/app/studio" className="text-text-muted hover:text-text">
            {isPractitioner ? 'Studio' : 'Become a provider'}
          </Link>
          {isPractitioner ? (
            <Link href="/app/feed" className="text-text-muted hover:text-text">
              Requests
            </Link>
          ) : null}
          {isAdmin ? (
            <Link href="/app/admin" className="text-text-muted hover:text-text">
              Admin
            </Link>
          ) : null}
        </nav>
        <SignOutButton />
      </Container>
    </div>
  );
}
