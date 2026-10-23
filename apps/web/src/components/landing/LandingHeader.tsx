'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

import { SmomoLockup } from '@/components/landing/SmomoMark';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/landing-content';

const NAV = [
  { href: '/#explore', label: 'Explore' },
  { href: ROUTES.howItWorks, label: 'How It Works' },
  { href: ROUTES.forPros, label: 'For Professionals' },
] as const;

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  // Show "My SMOMO" instead of Log in / Join when a session exists.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setSignedIn(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Header gains a solid ground and hairline once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobile sheet: lock scroll, move focus in, trap Tab, close on Escape, give focus back.
  useEffect(() => {
    if (!open) {
      if (wasOpen.current) toggleRef.current?.focus();
      wasOpen.current = false;
      return;
    }
    wasOpen.current = true;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      if (e.key !== 'Tab' || !sheetRef.current) return;
      const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    // Growing past the mobile breakpoint with the sheet open would strand the scroll lock.
    const mq = window.matchMedia('(min-width: 1024px)');
    const onMq = () => {
      if (mq.matches) close();
    };
    mq.addEventListener('change', onMq);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
      mq.removeEventListener('change', onMq);
    };
  }, [open, close]);

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-200 ${
        scrolled ? 'border-b border-line bg-canvas' : 'border-b border-transparent bg-canvas'
      }`}
    >
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[80rem] items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="SMOMO home" className="shrink-0 text-ink">
          <SmomoLockup markClassName="h-8 sm:h-9" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} className="whitespace-nowrap rounded-full px-4 py-2 text-[0.9375rem] font-medium text-ink">
              <span className="u-link">{n.label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {signedIn ? (
            <Link href="/app" className="sm-btn sm-btn--ink !min-h-11 !px-5 !py-2 text-[0.9375rem]">
              My SMOMO
            </Link>
          ) : (
            <>
              <Link href={ROUTES.login} className="rounded-full px-4 py-2 text-[0.9375rem] font-medium text-ink">
                <span className="u-link">Log In</span>
              </Link>
              <Link href={ROUTES.register} className="sm-btn sm-btn--ink !min-h-11 !px-5 !py-2 text-[0.9375rem]">
                Join SMOMO
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {/* Wrapper hides it on the narrowest phones: .sm-btn's display would beat a `hidden` utility. */}
          <div className="hidden min-[350px]:block">
            <Link href={ROUTES.postRequest} className="sm-btn sm-btn--pink !min-h-11 whitespace-nowrap !px-4 !py-2 text-sm">
              Post Your Look
            </Link>
          </div>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={open}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
              <path d="M4 8h16M4 16h16" />
            </svg>
          </button>
        </div>
      </div>

      {open ? (
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="on-ink fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink px-5 pb-8 pt-4 text-canvas lg:hidden"
        >
          <div className="flex h-12 items-center justify-between">
            <SmomoLockup markClassName="h-8" />
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-canvas text-canvas"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
                <path d="M5 5l14 14M19 5L5 19" />
              </svg>
            </button>
          </div>

          <nav aria-label="Mobile" className="mt-8 flex flex-col">
            {NAV.map((n) => (
              <Link key={n.label} href={n.href} onClick={close} className="sheet-link">
                {n.label}
                <span aria-hidden className="text-pink">
                  ↗
                </span>
              </Link>
            ))}
            {signedIn ? (
              <Link href="/app" onClick={close} className="sheet-link">
                My SMOMO
                <span aria-hidden className="text-pink">
                  ↗
                </span>
              </Link>
            ) : (
              <Link href={ROUTES.login} onClick={close} className="sheet-link">
                Log In
                <span aria-hidden className="text-pink">
                  ↗
                </span>
              </Link>
            )}
          </nav>

          <div className="mt-auto grid gap-3 pt-10">
            <Link href={ROUTES.postRequest} onClick={close} className="sm-btn sm-btn--pink">
              Post Your Look
            </Link>
            {signedIn ? null : (
              <Link href={ROUTES.register} onClick={close} className="sm-btn sm-btn--line">
                Join SMOMO
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
