'use client';

import { useState, useTransition } from 'react';

import { COUNTRIES, COUNTRY_LIST, type CountryCode } from '@smomo/shared';

import { saveBase, setOnline } from '@/app/(console)/studio/actions';

/**
 * Where the pro is based, and whether they are taking work.
 *
 * The city is a chosen value rather than free text wherever possible: since migration 16
 * matching falls back to comparing `lower(btrim(city))` on both sides, a typo silently
 * removes the pro from every search. The known cities are offered as a datalist, and a
 * free-typed city is still accepted — a pro in a town we do not list should not be stuck.
 */
export function BaseAndStatus({
  baseAddress,
  city,
  isOnline,
  verified,
}: {
  baseAddress: string;
  city: string;
  isOnline: boolean;
  verified: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [country, setCountry] = useState<CountryCode>('ZA');
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [onlinePending, startOnline] = useTransition();
  const [onlineError, setOnlineError] = useState<string>();

  return (
    <div className="space-y-5">
      <form
        className="panel"
        action={(data) => {
          setError(undefined);
          setSaved(false);
          startTransition(async () => {
            const result = await saveBase(data);
            if (result.ok) setSaved(true);
            else setError(result.error);
          });
        }}
      >
        <div className="panel-head">
          <h2 className="panel-title">Where you are based</h2>
          {saved ? <span className="text-xs text-success">Saved</span> : null}
        </div>
        <div className="panel-body space-y-4">
          <p className="text-sm text-text-muted">
            Clients in the same city find you. Address search is off, so this is typed.
          </p>

          <label className="field">
            <span className="font-medium text-text">Address</span>
            <input
              name="baseAddress"
              className="input"
              defaultValue={baseAddress}
              maxLength={300}
              placeholder="12 Main Road, Rosebank"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="field">
              <span className="font-medium text-text">Country</span>
              <select
                className="input"
                value={country}
                onChange={(e) => setCountry(e.target.value as CountryCode)}
              >
                {COUNTRY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="font-medium text-text">City or town</span>
              <input
                name="city"
                className="input"
                defaultValue={city}
                list="known-cities"
                maxLength={120}
                required
                placeholder={COUNTRIES[country].cities[0]?.name}
              />
              <datalist id="known-cities">
                {COUNTRIES[country].cities.map((c) => (
                  <option key={c.slug} value={c.name} />
                ))}
              </datalist>
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-danger/40 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn-console btn-console-primary" disabled={pending}>
            {pending ? 'Saving…' : 'Save base'}
          </button>
        </div>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2 className="panel-title">Taking work</h2>
        </div>
        <div className="panel-body space-y-2">
          <p className="text-sm text-text-muted">
            {isOnline
              ? 'You are online. New requests in your categories and area reach you.'
              : 'You are offline. No new requests will reach you.'}
          </p>
          {!verified ? (
            <p className="text-sm text-warning">
              Going online has no effect until your account is verified.
            </p>
          ) : null}
          {onlineError ? (
            <p className="text-sm text-danger" role="alert">
              {onlineError}
            </p>
          ) : null}
          <button
            type="button"
            className={isOnline ? 'btn-console' : 'btn-console btn-console-primary'}
            disabled={onlinePending}
            onClick={() => {
              setOnlineError(undefined);
              const data = new FormData();
              data.set('isOnline', String(!isOnline));
              startOnline(async () => {
                const result = await setOnline(data);
                if (!result.ok) setOnlineError(result.error);
              });
            }}
          >
            {onlinePending ? 'Saving…' : isOnline ? 'Go offline' : 'Go online'}
          </button>
        </div>
      </div>
    </div>
  );
}
