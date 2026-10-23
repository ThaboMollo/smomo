'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { COUNTRIES, COUNTRY_LIST, type CountryCode } from '@smomo/shared';

import type { Place, Suggestion } from '@/lib/places';

const MapPin = dynamic(() => import('./MapPin').then((m) => m.MapPin), {
  ssr: false,
  loading: () => <div className="h-56 w-full animate-pulse rounded-2xl bg-card-muted" aria-hidden />,
});

type Props = {
  label: string;
  hint?: ReactNode;
  placeholder?: string;
  /** The confirmed location, or null while nothing is chosen. */
  value: Place | null;
  onChange: (place: Place | null) => void;
  /** Shown under the field, e.g. "Choose where you need the pro". */
  error?: string | null;
  /** Show the map with a draggable pin once a place is chosen (default true). */
  showMap?: boolean;
  /** Bias suggestions toward here, e.g. the last known location. */
  bias?: { lat: number; lng: number } | null;
  autoComplete?: string;
  /** Text to show before anything is chosen, e.g. an address saved earlier as plain text. */
  initialText?: string;
  /** Called with the raw text as it is typed, for optional fields that may keep plain text. */
  onText?: (text: string) => void;
};

const newSession = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()));

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as T;
}

/**
 * Address search in the style of a ride-hailing app: type, pick a suggestion, and the app
 * knows where you are. It also offers "use my current location", a draggable pin to fine-tune
 * the spot, and a pick-your-city fallback for addresses the search can't find.
 */
export function AddressField({ label, hint, placeholder = 'Start typing an address, suburb or town', value, onChange, error, showMap = true, bias, autoComplete, initialText, onText }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const [query, setQuery] = useState(value?.label ?? initialText ?? '');
  const [typed, setTyped] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searched, setSearched] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [cityPicker, setCityPicker] = useState(false);
  const [pickCountry, setPickCountry] = useState<CountryCode>('ZA');
  const session = useRef(newSession());
  const wrap = useRef<HTMLDivElement>(null);

  // Show a location chosen elsewhere (e.g. remembered from another page). Done while
  // rendering, only when `value` actually changes, so it never fights the user's typing.
  const [seenValue, setSeenValue] = useState(value);
  if (value !== seenValue) {
    setSeenValue(value);
    if (value && value.label !== query) setQuery(value.label);
  }

  // Debounced search while typing.
  useEffect(() => {
    if (!typed) return;
    const q = query.trim();
    if (q.length < 3) return; // the change handler already cleared the list
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setSearchFailed(false);
      try {
        const params = new URLSearchParams({ q, session: session.current });
        if (bias) {
          params.set('lat', String(bias.lat));
          params.set('lng', String(bias.lng));
        }
        const j = await getJson<{ suggestions: Suggestion[] }>(`/api/places/autocomplete?${params}`, ctl.signal);
        setItems(j.suggestions);
        setActive(-1);
        setSearched(true);
        setOpen(true);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') {
          setSearchFailed(true);
          setItems([]);
          setSearched(true);
          setOpen(true);
        }
      } finally {
        if (!ctl.signal.aborted) setLoading(false);
      }
    }, 280);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [query, typed, bias]);

  // Close the list when clicking elsewhere.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const confirm = useCallback(
    (p: Place) => {
      setTyped(false);
      setOpen(false);
      setItems([]);
      setNotice(null);
      setCityPicker(false);
      setQuery(p.label);
      onText?.(p.label);
      session.current = newSession();
      onChange(p);
    },
    [onChange, onText],
  );

  const choose = async (s: Suggestion) => {
    const label = [s.primary, s.secondary].filter(Boolean).join(', ');
    if (s.lat != null && s.lng != null) {
      confirm({ label, lat: s.lat, lng: s.lng, country: s.country ?? null });
      return;
    }
    setLoading(true);
    try {
      const j = await getJson<{ place: Place }>(`/api/places/details?id=${encodeURIComponent(s.id)}&session=${session.current}`);
      confirm({ ...j.place, label: j.place.label || label });
    } catch {
      setNotice('We couldn’t get that address’s position. Try another suggestion.');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter') {
      // Never submit the surrounding form from here.
      if (open && items.length) {
        e.preventDefault();
        void choose(items[active >= 0 ? active : 0]);
      } else if (typed) {
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const useMyLocation = () => {
    setNotice(null);
    if (!('geolocation' in navigator)) return setNotice('This browser can’t share your location. Search for an address instead.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const j = await getJson<{ place: Place }>(`/api/places/reverse?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
          if (!j.place.country) {
            setNotice('Your current location is outside the countries SMOMO serves yet. Search for an address instead.');
          } else {
            confirm(j.place);
          }
        } catch {
          confirm({ label: 'My current location', lat: pos.coords.latitude, lng: pos.coords.longitude, country: null });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setNotice(
          err.code === err.PERMISSION_DENIED
            ? 'Location is switched off for this site. Search for an address instead, or allow location in your browser settings.'
            : 'We couldn’t get your position. Search for an address instead.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60_000 },
    );
  };

  const moved = async (lat: number, lng: number) => {
    const base = value;
    try {
      const j = await getJson<{ place: Place }>(`/api/places/reverse?lat=${lat}&lng=${lng}`);
      confirm({ label: j.place.label || base?.label || 'Dropped pin', lat, lng, country: j.place.country ?? base?.country ?? null, city: j.place.city });
    } catch {
      confirm({ label: base?.label ?? 'Dropped pin', lat, lng, country: base?.country ?? null, city: base?.city });
    }
  };

  const country = value?.country ? COUNTRIES[value.country] : null;
  const showEmpty = open && searched && !loading && !items.length && query.trim().length >= 3;
  const status = loading ? 'Searching…' : items.length ? `${items.length} suggestion${items.length === 1 ? '' : 's'} available` : '';

  return (
    <div className="field" ref={wrap}>
      <label htmlFor={id} className="font-medium text-text">
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          className="input pr-12"
          value={query}
          placeholder={placeholder}
          autoComplete={autoComplete ?? 'off'}
          role="combobox"
          aria-expanded={open && (items.length > 0 || showEmpty)}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${id}-opt-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setQuery(e.target.value);
            onText?.(e.target.value);
            setTyped(true);
            setNotice(null);
            if (e.target.value.trim().length < 3) {
              setItems([]);
              setSearched(false);
              setSearchFailed(false);
              setLoading(false);
              setOpen(false);
            }
            if (value) onChange(null); // typing again means the previous pick no longer applies
          }}
          onFocus={(e) => {
            // A chosen address is selected on focus so typing replaces it instead of appending.
            if (value) e.currentTarget.select();
            if (items.length) setOpen(true);
          }}
          onKeyDown={onKeyDown}
        />
        {loading ? (
          <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-text-faint border-t-transparent" />
        ) : value ? (
          <span aria-hidden className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-success">
            ✓
          </span>
        ) : null}

        {open && (items.length > 0 || showEmpty) ? (
          <ul
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="absolute z-30 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-card p-1 shadow-xl"
          >
            {items.map((s, i) => (
              <li
                key={`${s.id}-${i}`}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void choose(s)}
                className={`flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 ${i === active ? 'bg-primary-100' : ''}`}
              >
                <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary-700">
                  <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span className="min-w-0">
                  <span className="block truncate font-medium text-text">{s.primary}</span>
                  {s.secondary ? <span className="block truncate text-sm text-text-muted">{s.secondary}</span> : null}
                </span>
              </li>
            ))}
            {showEmpty ? (
              <li role="presentation" className="px-3 py-3 text-sm text-text-muted">
                {searchFailed ? 'Address search isn’t available right now.' : 'No matches. Try the suburb or town name.'}{' '}
                <button type="button" className="font-medium text-primary-700 underline underline-offset-4" onMouseDown={(e) => e.preventDefault()} onClick={() => { setCityPicker(true); setOpen(false); }}>
                  Choose your city instead
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <button type="button" onClick={useMyLocation} disabled={locating} className="inline-flex min-h-9 items-center gap-1.5 font-medium text-primary-700 underline-offset-4 hover:underline disabled:opacity-60">
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3.2" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            <circle cx="12" cy="12" r="7.5" />
          </svg>
          {locating ? 'Finding you…' : 'Use my current location'}
        </button>
        <button type="button" onClick={() => setCityPicker((v) => !v)} aria-expanded={cityPicker} className="min-h-9 text-text-muted underline-offset-4 hover:underline">
          Can’t find it? Choose your city
        </button>
      </div>

      {cityPicker ? (
        <div className="rounded-2xl border border-border bg-card-muted p-3">
          <p className="text-sm text-text-muted">Pick your city, then drag the pin to your exact spot.</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Country">
            {COUNTRY_LIST.map((c) => (
              <button key={c.code} type="button" className="chip" aria-pressed={pickCountry === c.code} onClick={() => setPickCountry(c.code)}>
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="City">
            {COUNTRIES[pickCountry].cities.map((c) => (
              <button
                key={c.slug}
                type="button"
                className="chip"
                onClick={() => confirm({ label: `${c.name}, ${COUNTRIES[pickCountry].name}`, lat: c.lat, lng: c.lng, country: pickCountry, city: c.name })}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {notice ? (
        <p className="text-sm text-danger" role="alert">
          {notice}
        </p>
      ) : null}

      {value && showMap ? (
        <div className="mt-1 space-y-2">
          <MapPin lat={value.lat} lng={value.lng} onMove={moved} />
          <p className="text-sm text-text-muted">
            <span className="font-medium text-text">Located{country ? ` in ${country.name}` : ''}.</span> Drag the pin if it’s not quite right.
          </p>
        </div>
      ) : value ? (
        <p className="text-sm text-text-muted">
          <span className="font-medium text-text">Located{country ? ` in ${country.name}` : ''}.</span>
        </p>
      ) : null}

      {error ? (
        <span className="text-sm text-danger" role="alert">
          {error}
        </span>
      ) : hint && !value ? (
        <span className="text-sm text-text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
