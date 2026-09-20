'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'smomo-install-dismissed';

/**
 * Registers the service worker and shows a dismissible install prompt.
 * - Chromium/Android/desktop: uses the captured `beforeinstallprompt` event.
 * - iOS Safari: shows the manual "Add to Home Screen" hint (no event exists there).
 * Renders nothing when already installed (standalone) or previously dismissed.
 */
export function PwaProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(true); // hidden until we know it's useful

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Register the service worker.
    if ('serviceWorker' in navigator) {
      const register = () =>
        navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register, { once: true });
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari exposes standalone on navigator.
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    setDismissed(false);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS never fires beforeinstallprompt — detect it to show manual instructions.
    const ua = window.navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    const isSafari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    if (isIos && isSafari) setShowIosHint(true);

    const onInstalled = () => {
      setDeferredPrompt(null);
      setShowIosHint(false);
      setDismissed(true);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
    setDismissed(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md items-center gap-3 rounded border border-border bg-card p-3 shadow-lg">
        <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">Install Smomo</p>
          <p className="truncate text-xs text-text-muted">
            {deferredPrompt
              ? 'Add it to your home screen for a faster, app-like experience.'
              : 'Tap the Share icon, then “Add to Home Screen”.'}
          </p>
        </div>
        {deferredPrompt ? (
          <button
            onClick={install}
            className="shrink-0 rounded border border-primary px-3 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-100"
          >
            Install
          </button>
        ) : null}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded px-2 py-2 text-text-faint transition-colors hover:bg-card-muted"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
