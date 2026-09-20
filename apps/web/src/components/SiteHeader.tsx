'use client';

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { BrandLogo } from '@/components/BrandLogo';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Container } from '@/components/ui';
import { CATEGORY_LABEL, CATEGORY_SLUG_LIST } from '@/lib/catalog';

/** Marketing chrome is for public pages only — the app and auth screens carry their own nav. */
function hideChrome(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname.startsWith('/app');
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (hideChrome(pathname)) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Smomo" className="shrink-0">
          <BrandLogo className="h-9 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-text-muted md:flex">
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={open}
              className="inline-flex items-center gap-1.5 border-b border-transparent pb-0.5 hover:border-primary hover:text-text"
            >
              Find a pro
              <Icon
                icon={faChevronDown}
                size={11}
                className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>

            {open ? (
              <div
                role="menu"
                className="absolute left-0 top-full mt-2 w-60 rounded border border-border bg-card p-1 shadow-sm"
              >
                {CATEGORY_SLUG_LIST.map((c) => (
                  <Link
                    key={c}
                    role="menuitem"
                    href={`/${c}`}
                    className="flex items-center gap-2.5 rounded px-3 py-2 text-text transition-colors hover:bg-primary-100"
                  >
                    <CategoryIcon category={c} size={18} />
                    {CATEGORY_LABEL[c]}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          <Link
            href="/download"
            className="border-b border-transparent pb-0.5 hover:border-primary hover:text-text"
          >
            Get the app
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/how-it-works"
            className="rounded border border-primary px-4 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-100"
          >
            How it works
          </Link>
        </div>
      </Container>
    </header>
  );
}
