'use client';

import Link from 'next/link';

import { BrandLogo } from '@/components/BrandLogo';
import { Container } from '@/components/ui';
import { SignOutButton } from '@/components/SignOutButton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useMe } from '@/lib/use-me';

export function AppNav() {
  const { data } = useMe();
  const isPractitioner = !!data?.profile?.is_practitioner;
  const isAdmin = !!data?.profile?.is_admin;

  return (
    <div className="border-b border-border bg-card">
      <Container className="flex h-14 items-center justify-between">
        <nav className="flex items-center gap-4 overflow-x-auto text-sm font-medium">
          <Link href="/app" aria-label="Smomo" className="shrink-0">
            <BrandLogo className="h-7 w-auto" priority />
          </Link>
          <Link href="/app" className="text-text-muted hover:text-text">
            Dashboard
          </Link>
          <Link href="/app/discover" className="text-text-muted hover:text-text">
            Discover
          </Link>
          <Link href="/app/chats" className="text-text-muted hover:text-text">
            Chats
          </Link>
          <Link href="/app/studio" className="text-text-muted hover:text-text">
            {isPractitioner ? 'Studio' : 'Become a provider'}
          </Link>
          {isPractitioner ? (
            <>
              <Link href="/app/feed" className="text-text-muted hover:text-text">
                Requests
              </Link>
              <Link href="/app/schedule" className="text-text-muted hover:text-text">
                Schedule
              </Link>
            </>
          ) : null}
          {isAdmin ? (
            <Link href="/app/admin" className="text-text-muted hover:text-text">
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Link href="/app/profile" className="text-sm font-medium text-text-muted hover:text-text">
            Profile
          </Link>
          <SignOutButton />
        </div>
      </Container>
    </div>
  );
}
