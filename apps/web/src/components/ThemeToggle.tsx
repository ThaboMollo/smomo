'use client';

import { faCircleHalfStroke, faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';

import { Icon } from '@/components/Icon';

type Theme = 'light' | 'dark';

/** Light/dark toggle. The initial theme is set pre-paint by the inline script
 *  in the root layout, so here we just read it and flip it. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = (document.documentElement.getAttribute('data-theme') as Theme) ?? 'light';
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode — ignore */
    }
    setTheme(next);
  };

  // Before mount, theme is unknown on the client too, so render a neutral icon
  // that matches SSR and avoids a hydration mismatch.
  const icon = theme == null ? faCircleHalfStroke : theme === 'dark' ? faSun : faMoon;
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded border border-border text-text-muted transition-colors hover:bg-primary-100 hover:text-text ${className}`}
    >
      <Icon icon={icon} size={15} className="text-current" />
    </button>
  );
}
