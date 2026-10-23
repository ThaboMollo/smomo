'use client';

import { faBars, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { BrandLogo } from '@/components/BrandLogo';
import { Icon } from '@/components/Icon';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Container } from '@/components/ui';
import { CATEGORY_IMAGE, CATEGORY_LABEL, CATEGORY_NOTE, CATEGORY_SLUG_LIST } from '@/lib/catalog';

/** Marketing chrome is for public pages only; the app and auth screens carry their own nav. */
function hideChrome(pathname: string) {
  return pathname === '/login' || pathname === '/register' || pathname.startsWith('/app');
}

const linkCls = 'rounded-full px-3 py-2 text-[15px] text-text transition-colors hover:bg-primary-100';

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on navigation.
  useEffect(() => {
    setOpen(false);
    setMobile(false);
  }, [pathname]);

  // Close the desktop menu on outside click or Escape.
  useEffect(() => {
    if (!open && !mobile) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setMobile(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, mobile]);

  // Lock scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = mobile ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobile]);

  if (hideChrome(pathname)) return null;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-bg/85 backdrop-blur-md">
      <Container className="flex h-[72px] items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Smomo home" className="shrink-0">
            <BrandLogo className="h-9 w-auto" priority />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-haspopup="true"
                aria-expanded={open}
                className={`${linkCls} inline-flex items-center gap-1.5`}
              >
                Find a pro
                <Icon
                  icon={faChevronDown}
                  size={11}
                  className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>

              {open ? (
                <div className="absolute left-0 top-full mt-3 w-[560px] rounded-[24px] border border-border bg-card p-3 shadow-xl shadow-primary-900/10">
                  <div className="grid grid-cols-2 gap-1">
                    {CATEGORY_SLUG_LIST.map((c) => (
                      <Link
                        key={c}
                        href={`/${c}`}
                        className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-primary-100"
                      >
                        <Image
                          src={CATEGORY_IMAGE[c]}
                          alt=""
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-xl object-cover"
                        />
                        <span>
                          <span className="block font-medium text-text">{CATEGORY_LABEL[c]}</span>
                          <span className="block text-xs text-text-muted">{CATEGORY_NOTE[c]}</span>
                        </span>
                      </Link>
                    ))}
                    <Link
                      href="/app/request/new"
                      className="flex flex-col justify-center rounded-2xl bg-primary-950 p-3 text-white transition-colors hover:bg-primary-900"
                    >
                      <span className="font-medium">Not sure who?</span>
                      <span className="text-xs text-primary-300">Post a request, get offers</span>
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            <Link href="/how-it-works" className={linkCls}>
              How it works
            </Link>
            <Link href="/how-it-works#pros" className={linkCls}>
              For pros
            </Link>
            <Link href="/download" className={linkCls}>
              Get the app
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={`${linkCls} hidden sm:inline-flex`}>
            Log in
          </Link>
          <Link href="/app/request/new" className="btn btn-primary hidden sm:inline-flex">
            Post a request
          </Link>
          <button
            type="button"
            onClick={() => setMobile(true)}
            aria-label="Open menu"
            aria-expanded={mobile}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card md:hidden"
          >
            <Icon icon={faBars} size={16} className="text-text" />
          </button>
        </div>
      </Container>

      {mobile ? (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-primary-950/50"
            onClick={() => setMobile(false)}
          />
          <div className="absolute inset-x-3 top-3 max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[28px] bg-card p-5">
            <div className="flex items-center justify-between">
              <BrandLogo className="h-8 w-auto" />
              <button
                type="button"
                onClick={() => setMobile(false)}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border"
              >
                <Icon icon={faXmark} size={16} className="text-text" />
              </button>
            </div>
            <p className="kicker mt-6">Find a pro</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {CATEGORY_SLUG_LIST.map((c) => (
                <Link
                  key={c}
                  href={`/${c}`}
                  className="flex items-center gap-2 rounded-2xl border border-border p-2 text-sm font-medium"
                >
                  <Image src={CATEGORY_IMAGE[c]} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover" />
                  {CATEGORY_LABEL[c]}
                </Link>
              ))}
            </div>
            <nav aria-label="Mobile" className="mt-5 flex flex-col text-lg">
              <Link href="/how-it-works" className="border-b border-border py-3">
                How it works
              </Link>
              <Link href="/how-it-works#pros" className="border-b border-border py-3">
                For pros
              </Link>
              <Link href="/download" className="border-b border-border py-3">
                Get the app
              </Link>
            </nav>
            <div className="mt-6 grid gap-2">
              <Link href="/app/request/new" className="btn btn-primary btn-block">
                Post a request
              </Link>
              <Link href="/login" className="btn btn-outline btn-block">
                Log in
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
