import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

/** Matches the web, which stores exactly this under `theme` in localStorage. */
export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';

type ThemeContextValue = {
  /** What the person chose. `system` follows the OS. */
  preference: ThemePreference;
  /** What that resolves to right now. */
  scheme: 'light' | 'dark';
  setPreference: (p: ThemePreference) => void;
  /** Cycles light → dark → system, the order the toggle steps through. */
  toggle: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const osScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (!cancelled && (v === 'light' || v === 'dark' || v === 'system')) {
          setPreferenceState(v);
        }
      })
      .catch(() => {
        /* unreadable storage — stay on the OS setting */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((p: ThemePreference) => {
    setPreferenceState(p);
    AsyncStorage.setItem(STORAGE_KEY, p).catch(() => {
      /* the choice still applies for this session */
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    // `useColorScheme` can also report 'unspecified'; anything that isn't dark is light.
    const resolvedOs = osScheme === 'dark' ? 'dark' : 'light';
    const scheme = preference === 'system' ? resolvedOs : preference;
    return {
      preference,
      scheme,
      setPreference,
      toggle: () =>
        setPreference(
          preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light',
        ),
    };
  }, [preference, osScheme, setPreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The preference controls. For colours, use `useTheme` from `@/lib/theme`. */
export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemePreference must be used inside <ThemeProvider>');
  return ctx;
}
