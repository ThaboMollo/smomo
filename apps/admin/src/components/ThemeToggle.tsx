'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Light / dark, stored under `theme` — the same key the consumer web app and the mobile
 * app read, so a choice made on one surface carries to the others on this device.
 *
 * The current theme lives on `<html data-theme>`, written before paint by the script in
 * the root layout. That makes it external state that React does not own, so this reads it
 * with `useSyncExternalStore` rather than copying it into state inside an effect: the
 * server snapshot keeps hydration honest, and there is no render-then-correct flash.
 */
type Pref = 'light' | 'dark';

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function snapshot(): Pref {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

/** On the server the attribute does not exist yet; the script sets it before first paint. */
function serverSnapshot(): Pref {
  return 'light';
}

export function ThemeToggle() {
  const pref = useSyncExternalStore(subscribe, snapshot, serverSnapshot);

  const toggle = useCallback(() => {
    const next: Pref = snapshot() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Private mode: the choice still applies for this session.
    }
    listeners.forEach((l) => l());
  }, []);

  const toDark = pref === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      className="btn-console"
      aria-label={`Switch to ${toDark ? 'dark' : 'light'} theme`}
      suppressHydrationWarning
    >
      {toDark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.6 6.6 0 0 0 9.8 9.8Z" />
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      )}
      <span suppressHydrationWarning>{toDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}
