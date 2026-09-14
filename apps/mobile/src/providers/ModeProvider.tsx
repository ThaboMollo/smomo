import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type AppMode = 'client' | 'work';

const MODE_KEY = 'smomo.mode';
const CHOSEN_KEY = 'smomo.roleChosen';

type ModeState = {
  mode: AppMode;
  /** Whether the user has explicitly picked a role on the welcome screen. */
  hasChosen: boolean;
  hydrated: boolean;
  setMode: (m: AppMode) => void;
  /** Clear the chosen role (used on sign-out so the user returns to the welcome chooser). */
  resetChoice: () => void;
};

const ModeContext = createContext<ModeState | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>('client');
  const [hasChosen, setHasChosen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const [m, c] = await Promise.all([
        AsyncStorage.getItem(MODE_KEY),
        AsyncStorage.getItem(CHOSEN_KEY),
      ]);
      if (m === 'client' || m === 'work') setModeState(m);
      if (c === '1') setHasChosen(true);
      setHydrated(true);
    })();
  }, []);

  const setMode = (m: AppMode) => {
    setModeState(m);
    setHasChosen(true);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
    AsyncStorage.setItem(CHOSEN_KEY, '1').catch(() => {});
  };

  const resetChoice = () => {
    setModeState('client');
    setHasChosen(false);
    AsyncStorage.multiRemove([MODE_KEY, CHOSEN_KEY]).catch(() => {});
  };

  const value = useMemo(
    () => ({ mode, hasChosen, hydrated, setMode, resetChoice }),
    [mode, hasChosen, hydrated],
  );
  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

export function useMode(): ModeState {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used within ModeProvider');
  return ctx;
}
