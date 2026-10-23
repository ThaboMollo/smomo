'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';

/**
 * Small map with a draggable pin, so people can fine-tune a spot the address search only
 * got approximately (common for informal and rural addresses). Tiles come from
 * NEXT_PUBLIC_MAP_TILES_URL (default: OpenStreetMap's public tile server, which is fine for
 * light use; set a commercial provider's URL before heavy traffic).
 */
const TILES = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION = process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

const PIN = `<svg width="36" height="44" viewBox="0 0 36 44" aria-hidden="true"><path d="M18 43C18 43 33 27.5 33 17.5 33 9.2 26.3 2.5 18 2.5S3 9.2 3 17.5C3 27.5 18 43 18 43Z" fill="#E64D74" stroke="#251719" stroke-width="2.5"/><circle cx="18" cy="17.5" r="5.5" fill="#251719"/></svg>`;

export function MapPin({ lat, lng, onMove }: { lat: number; lng: number; onMove: (lat: number, lng: number) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<Marker | null>(null);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  // Create the map once.
  useEffect(() => {
    let disposed = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (disposed || !el.current) return;
      const m = L.map(el.current, { center: [lat, lng], zoom: 15, scrollWheelZoom: false });
      L.tileLayer(TILES, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(m);
      const icon = L.divIcon({ className: 'smomo-pin', html: PIN, iconSize: [36, 44], iconAnchor: [18, 42] });
      const mk = L.marker([lat, lng], { icon, draggable: true, title: 'Drag to adjust your exact location' }).addTo(m);
      mk.on('dragend', () => {
        const p = mk.getLatLng();
        onMoveRef.current(p.lat, p.lng);
      });
      m.on('click', (e) => {
        mk.setLatLng(e.latlng);
        onMoveRef.current(e.latlng.lat, e.latlng.lng);
      });
      map.current = m;
      marker.current = mk;
    })();
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- created once; position changes are synced below
  }, []);

  // Follow position changes made elsewhere (a new search result, "use my location").
  useEffect(() => {
    const m = map.current;
    const mk = marker.current;
    if (!m || !mk) return;
    const cur = mk.getLatLng();
    if (Math.abs(cur.lat - lat) < 1e-7 && Math.abs(cur.lng - lng) < 1e-7) return;
    mk.setLatLng([lat, lng]);
    m.setView([lat, lng], Math.max(m.getZoom(), 15));
  }, [lat, lng]);

  return (
    <div
      ref={el}
      role="application"
      aria-label="Map showing your location. Drag the pin, or click the map, to adjust it."
      className="isolate h-56 w-full overflow-hidden rounded-2xl border border-border bg-card-muted"
    />
  );
}
