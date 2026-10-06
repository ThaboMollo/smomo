'use client';

import { useState } from 'react';

/** Password field with a show / hide toggle. */
export function PasswordInput({
  value,
  onChange,
  autoComplete,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  invalid?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input
        type={show ? 'text' : 'password'}
        className="input pr-20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-1.5 top-1/2 min-h-[40px] -translate-y-1/2 rounded-full px-3 text-sm font-medium text-primary-700 hover:bg-primary-100"
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </span>
  );
}
