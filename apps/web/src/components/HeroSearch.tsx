'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CATEGORY_LABEL, CATEGORY_SLUG_LIST, CITIES, titleCase, type CategorySlug } from '@/lib/catalog';

/** Service + city finder. Sends people straight to the matching listing page. */
export function HeroSearch() {
  const router = useRouter();
  const [category, setCategory] = useState<CategorySlug>('hairdressers');
  const [city, setCity] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(city ? `/${category}/${city}` : `/${category}`);
  };

  const selectCls =
    'w-full cursor-pointer appearance-none bg-transparent pr-6 text-base text-text outline-none';

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-1 rounded-[28px] bg-card p-2 text-text sm:flex-row sm:items-stretch sm:rounded-full"
      role="search"
    >
      <label className="relative flex flex-1 flex-col justify-center rounded-full px-5 py-2 transition-colors hover:bg-primary-100">
        <span className="text-xs text-text-muted">Service</span>
        <select value={category} onChange={(e) => setCategory(e.target.value as CategorySlug)} className={selectCls}>
          {CATEGORY_SLUG_LIST.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
        <Chevron />
      </label>
      <span aria-hidden className="mx-5 h-px bg-border sm:mx-0 sm:my-3 sm:h-auto sm:w-px" />
      <label className="relative flex flex-1 flex-col justify-center rounded-full px-5 py-2 transition-colors hover:bg-primary-100">
        <span className="text-xs text-text-muted">City</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className={selectCls}>
          <option value="">Anywhere in SA</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {titleCase(c)}
            </option>
          ))}
        </select>
        <Chevron />
      </label>
      <button type="submit" className="btn btn-primary min-h-[52px] px-7 sm:min-h-0">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        Find pros
      </button>
    </form>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      className="pointer-events-none absolute bottom-3.5 right-5 text-text-muted"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
