'use client';

import { useEffect, useState } from 'react';

export type Coords = { latitude: number; longitude: number };

/** Cape Town CBD — fallback when the browser denies or lacks geolocation. */
export const CAPE_TOWN: Coords = { latitude: -33.9249, longitude: 18.4241 };

/**
 * Resolve the visitor's coordinates via the browser Geolocation API,
 * falling back to Cape Town. `ready` flips true once we've settled either way.
 */
export function useCoords() {
  const [coords, setCoords] = useState<Coords>(CAPE_TOWN);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setReady(true);
      },
      () => setReady(true),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  return { coords, ready };
}
