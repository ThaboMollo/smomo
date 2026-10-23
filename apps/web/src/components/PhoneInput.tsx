'use client';

import { COUNTRIES, COUNTRY_LIST, type CountryCode } from '@smomo/shared';

/** Mobile number input with a country picker, so numbers from each country normalise correctly. */
export function PhoneInput({
  id,
  country,
  onCountryChange,
  value,
  onChange,
  invalid,
  autoComplete = 'tel-national',
}: {
  id?: string;
  country: CountryCode;
  onCountryChange: (c: CountryCode) => void;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex gap-2">
      <select
        aria-label="Country code"
        className="input w-[7.75rem] shrink-0 cursor-pointer px-3"
        value={country}
        onChange={(e) => onCountryChange(e.target.value as CountryCode)}
      >
        {COUNTRY_LIST.map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} +{c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        className="input min-w-0 flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={COUNTRIES[country].example}
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}
