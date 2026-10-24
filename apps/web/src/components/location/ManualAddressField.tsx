'use client';

import { useId, useState, type ReactNode } from 'react';

import {
  COUNTRIES,
  COUNTRY_LIST,
  addressErrors,
  emptyAddress,
  formatAddress,
  isAddressComplete,
  isCityKnown,
  type CountryCode,
  type StructuredAddress,
} from '@smomo/shared';

import type { Place } from '@/lib/places';

type Props = {
  label: string;
  hint?: ReactNode;
  value: Place | null;
  onChange: (place: Place | null) => void;
  error?: string | null;
  /** Plain text saved earlier, shown so an existing address isn't silently dropped. */
  initialText?: string;
  onText?: (text: string) => void;
};

/**
 * The address form used while geolocation is parked: country, two address lines, suburb,
 * city, and whatever the country calls its province.
 *
 * It fills the same contract as `<AddressField>` so the two are interchangeable at every
 * call site — `onText` fires on every keystroke for the fields that only keep text, and
 * `onChange` emits a `Place` once the required parts are there, or null while they aren't.
 * The position comes from the city rather than a geocoder, so it is city-level at best;
 * the note under the form says so rather than implying a precision we don't have.
 */
export function ManualAddressField({ label, hint, value, onChange, error, initialText, onText }: Props) {
  const id = useId();
  const [addr, setAddr] = useState<StructuredAddress>(() => emptyAddress());
  const [touched, setTouched] = useState<Partial<Record<keyof StructuredAddress, boolean>>>({});
  const country = COUNTRIES[addr.country];
  const fieldErrors = addressErrors(addr);

  /** Apply one field, then re-publish the whole address upward. */
  const set = <K extends keyof StructuredAddress>(key: K, v: StructuredAddress[K]) => {
    // Changing country invalidates a subdivision that belonged to the old one.
    const next: StructuredAddress =
      key === 'country'
        ? { ...addr, country: v as CountryCode, subdivision: '' }
        : { ...addr, [key]: v };
    setAddr(next);

    const text = formatAddress(next);
    onText?.(text);
    if (isAddressComplete(next)) {
      // No coordinates on purpose: nothing here geocoded the address, so the city is what
      // matching uses (migration 16). Inventing a city-centre point would make every
      // "x km away" fiction.
      onChange({ label: text, lat: null, lng: null, country: next.country, city: next.city.trim() });
    } else if (value) {
      onChange(null); // an incomplete address is not a location
    }
  };

  const blur = (key: keyof StructuredAddress) => setTouched((t) => ({ ...t, [key]: true }));
  const errFor = (key: keyof StructuredAddress) => (touched[key] ? fieldErrors[key] : undefined);

  const inputCls = 'input';

  return (
    <fieldset className="field">
      <legend className="font-medium text-text">{label}</legend>

      {initialText && !value ? (
        <p className="rounded-2xl bg-card-muted px-4 py-3 text-sm text-text-muted">
          Saved earlier: <span className="text-text">{initialText}</span>
          <br />
          Fill the fields below to replace it.
        </p>
      ) : null}

      <div className="mt-1 space-y-3">
        <label className="field" htmlFor={`${id}-country`}>
          <span className="font-medium text-text">Country</span>
          <select
            id={`${id}-country`}
            className={inputCls}
            value={addr.country}
            onChange={(e) => set('country', e.target.value as CountryCode)}
          >
            {COUNTRY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field" htmlFor={`${id}-line1`}>
          <span className="font-medium text-text">Address line 1</span>
          <input
            id={`${id}-line1`}
            className={inputCls}
            value={addr.line1}
            placeholder="12 Main Road"
            autoComplete="address-line1"
            aria-invalid={errFor('line1') ? true : undefined}
            onChange={(e) => set('line1', e.target.value)}
            onBlur={() => blur('line1')}
          />
          {errFor('line1') ? (
            <span className="text-sm text-danger" role="alert">
              {errFor('line1')}
            </span>
          ) : null}
        </label>

        <label className="field" htmlFor={`${id}-line2`}>
          <span className="font-medium text-text">
            Address line 2 <span className="font-normal text-text-muted">(optional)</span>
          </span>
          <input
            id={`${id}-line2`}
            className={inputCls}
            value={addr.line2 ?? ''}
            placeholder="Unit 4, Oak Court"
            autoComplete="address-line2"
            onChange={(e) => set('line2', e.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="field" htmlFor={`${id}-suburb`}>
            <span className="font-medium text-text">Suburb</span>
            <input
              id={`${id}-suburb`}
              className={inputCls}
              value={addr.suburb}
              placeholder="Rosebank"
              autoComplete="address-level3"
              aria-invalid={errFor('suburb') ? true : undefined}
              onChange={(e) => set('suburb', e.target.value)}
              onBlur={() => blur('suburb')}
            />
            {errFor('suburb') ? (
              <span className="text-sm text-danger" role="alert">
                {errFor('suburb')}
              </span>
            ) : null}
          </label>

          <label className="field" htmlFor={`${id}-city`}>
            <span className="font-medium text-text">City or town</span>
            <input
              id={`${id}-city`}
              className={inputCls}
              value={addr.city}
              placeholder={country.cities[0]?.name ?? 'City'}
              autoComplete="address-level2"
              list={`${id}-cities`}
              aria-invalid={errFor('city') ? true : undefined}
              onChange={(e) => set('city', e.target.value)}
              onBlur={() => blur('city')}
            />
            {/* The known cities are the ones we can place on the map; others still save. */}
            <datalist id={`${id}-cities`}>
              {country.cities.map((c) => (
                <option key={c.slug} value={c.name} />
              ))}
            </datalist>
            {errFor('city') ? (
              <span className="text-sm text-danger" role="alert">
                {errFor('city')}
              </span>
            ) : null}
          </label>
        </div>

        <label className="field" htmlFor={`${id}-subdivision`}>
          <span className="font-medium text-text">{country.subdivisionLabel}</span>
          <select
            id={`${id}-subdivision`}
            className={inputCls}
            value={addr.subdivision}
            aria-invalid={errFor('subdivision') ? true : undefined}
            onChange={(e) => set('subdivision', e.target.value)}
            onBlur={() => blur('subdivision')}
          >
            <option value="">Choose {country.subdivisionLabel.toLowerCase()}…</option>
            {country.subdivisions.map((sd) => (
              <option key={sd} value={sd}>
                {sd}
              </option>
            ))}
          </select>
          {errFor('subdivision') ? (
            <span className="text-sm text-danger" role="alert">
              {errFor('subdivision')}
            </span>
          ) : null}
        </label>
      </div>

      {error ? (
        <span className="mt-1 text-sm text-danger" role="alert">
          {error}
        </span>
      ) : value ? (
        <p className="mt-1 text-sm text-text-muted">
          <span className="font-medium text-text">Saved as:</span> {value.label}
          <br />
          {isCityKnown(addr)
            ? `We'll match you with pros in ${addr.city}.`
            : `We'll match you with pros who work in ${addr.city}. Distances aren't shown without location.`}
        </p>
      ) : hint ? (
        <span className="mt-1 text-sm text-text-muted">{hint}</span>
      ) : null}
    </fieldset>
  );
}
