'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { COUNTRY_LIST } from '@smomo/shared';

import { CATEGORY_SLUG_LIST, type CategorySlug } from '@/lib/catalog';
import { CRAFTS, ROUTES } from '@/lib/landing-content';

const NAME = Object.fromEntries(CRAFTS.map((c) => [c.slug, c.name])) as Record<CategorySlug, string>;

function Chevron() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute bottom-3.5 right-4 text-ink"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Service + city finder. It routes to the existing public listings (/{category} or
 * /{category}/{city}), the same destinations the previous homepage finder used.
 */
export function HeroFinder() {
  const router = useRouter();
  const [category, setCategory] = useState<CategorySlug>('hairdressers');
  const [city, setCity] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(city ? `/${category}/${city}` : ROUTES.category(category));
  };

  return (
    <form onSubmit={onSubmit} role="search" aria-label="Find a pro" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="finder-field">
          <span className="label text-[0.6875rem] text-ink/70">What are you looking for?</span>
          <select value={category} onChange={(e) => setCategory(e.target.value as CategorySlug)}>
            {CATEGORY_SLUG_LIST.map((c) => (
              <option key={c} value={c}>
                {NAME[c]}
              </option>
            ))}
          </select>
          <Chevron />
        </label>
        <label className="finder-field">
          <span className="label text-[0.6875rem] text-ink/70">Where do you need it?</span>
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Anywhere in Southern Africa</option>
            {COUNTRY_LIST.map((country) => (
              <optgroup key={country.code} label={country.name}>
                {country.cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <Chevron />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="submit" className="sm-btn sm-btn--pink">
          Explore Talent
          <span aria-hidden className="arrow">
            ↗
          </span>
        </button>
        <Link href={ROUTES.postRequest} className="sm-btn sm-btn--line">
          Post Your Look
        </Link>
      </div>
    </form>
  );
}
