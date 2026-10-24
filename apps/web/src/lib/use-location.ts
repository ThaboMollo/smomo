'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { GEOLOCATION_ENABLED } from '@/lib/features';
import type { Place } from '@/lib/places';

/**
 * The person's chosen location, shared across pages and remembered on this device.
 *
 * There is deliberately no default: the old code fell back to Cape Town when location was
 * off, which is wrong for most of the countries SMOMO now serves. If nothing has been
 * chosen, `place` is null and the screen asks. The device GPS is only used silently when
 * the browser has already been granted permission; otherwise the person taps
 * "Use my current location" so the permission prompt is expected.
 */
const KEY = 'smomo.place.v1';
const listeners = new Set<() => void>();

let cachedRaw: string | null | undefined;
let cachedPlace: Place | null = null;

function snapshot(): Place | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* private mode */
  }
  if (raw === cachedRaw) return cachedPlace;
  cachedRaw = raw;
  try {
    const p = raw ? (JSON.parse(raw) as Place) : null;
    // A place is usable with coordinates OR with a city. Checking only the coordinates —
    // which is what this did before migration 16 — threw away every manually typed
    // address on reload, because those deliberately carry no point.
    const hasPoint = p != null && Number.isFinite(p.lat) && Number.isFinite(p.lng);
    const hasCity = !!p?.city?.trim();
    cachedPlace = p && (hasPoint || hasCity) ? p : null;
  } catch {
    cachedPlace = null;
  }
  return cachedPlace;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function storePlace(p: Place | null) {
  try {
    if (p) localStorage.setItem(KEY, JSON.stringify(p));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore: the in-memory choice for this page view still works */
  }
  cachedRaw = undefined;
  listeners.forEach((l) => l());
}

export function useLocation() {
  const place = useSyncExternalStore(subscribe, snapshot, () => null);
  const [ready, setReady] = useState(false);

  // Use the device position without prompting only if permission was already granted.
  useEffect(() => {
    let cancelled = false;
    const done = () => !cancelled && setReady(true);
    // Parked: never touch the Geolocation API, not even behind an already-granted
    // permission. The screen asks for a typed address instead.
    if (!GEOLOCATION_ENABLED || snapshot() || !('geolocation' in navigator) || !navigator.permissions?.query) {
      done();
      return () => {
        cancelled = true;
      };
    }
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((s) => {
        if (s.state !== 'granted') return done();
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const r = await fetch(`/api/places/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
              const j = (await r.json()) as { place?: Place };
              if (!cancelled && j.place?.country && !snapshot()) storePlace(j.place);
            } catch {
              /* leave unset: the screen will ask */
            }
            done();
          },
          done,
          { timeout: 6000, maximumAge: 300_000 },
        );
      })
      .catch(done);
    return () => {
      cancelled = true;
    };
  }, []);

  const setPlace = useCallback((p: Place | null) => storePlace(p), []);
  return { place, setPlace, ready };
}
