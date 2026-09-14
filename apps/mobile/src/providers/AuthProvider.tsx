import type { Session } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { Coords } from '@/lib/location';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { Enums, Tables } from '@/types/database';

export type Profile = Tables<'profiles'>;
export type PractitionerProfile = Tables<'practitioner_profiles'>;
export type Subscription = Tables<'subscriptions'>;

export type RegisterCommon = {
  firstName: string;
  lastName: string;
  mobile: string;
  whatsapp?: string | null;
  homeAddress?: string | null;
  email: string;
  password: string;
  idType: Enums<'id_type'>;
  idNumber: string;
  idCountry?: string | null;
};

export type RegisterPractitioner = RegisterCommon & {
  workAddress?: string | null;
  workCoords: Coords;
  payshapProxy: string;
};

export class EmailInUseError extends Error {
  constructor() {
    super('That email is already registered. Please log in instead.');
    this.name = 'EmailInUseError';
  }
}

type AuthState = {
  session: Session | null;
  userId: string | null;
  profile: Profile | null;
  practitioner: PractitionerProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  ready: boolean;
  isAnonymous: boolean;
  isAdmin: boolean;
  isPractitioner: boolean;
  isRegistered: boolean;
  refresh: () => Promise<void>;
  registerClient: (input: RegisterCommon) => Promise<void>;
  registerPractitioner: (input: RegisterPractitioner) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  /** For an already-registered user (e.g. a client) turning on practitioner mode. */
  finalizePractitioner: (input: {
    payshapProxy: string;
    workCoords: Coords;
    workAddress?: string | null;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

function isEmailInUse(message?: string): boolean {
  const m = (message ?? '').toLowerCase();
  return m.includes('already') && (m.includes('registered') || m.includes('exists') || m.includes('in use'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [practitioner, setPractitioner] = useState<PractitionerProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async (_uid: string) => {
    try {
      const me = await api.me.get();
      setProfile((me.profile as Profile) ?? null);
      setPractitioner((me.practitioner as PractitionerProfile) ?? null);
      setSubscription((me.subscription as Subscription) ?? null);
    } catch {
      setProfile(null);
      setPractitioner(null);
      setSubscription(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    if (data.session?.user?.id) await loadProfile(data.session.user.id);
  }, [loadProfile]);

  useEffect(() => {
    let active = true;

    (async () => {
      let { data } = await supabase.auth.getSession();
      // Browse-first: everyone gets an anonymous session immediately.
      if (!data.session) {
        await supabase.auth.signInAnonymously();
        data = (await supabase.auth.getSession()).data;
      }
      if (!active) return;
      setSession(data.session);
      if (data.session?.user?.id) await loadProfile(data.session.user.id);
      setLoading(false);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (s?.user?.id) {
        await loadProfile(s.user.id);
      } else {
        setProfile(null);
        setPractitioner(null);
        setSubscription(null);
        qc.clear();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile, qc]);

  const upgradeWithEmail = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    if (error) {
      if (isEmailInUse(error.message)) throw new EmailInUseError();
      throw error;
    }
  }, []);

  const registerClient = useCallback(
    async (input: RegisterCommon) => {
      await upgradeWithEmail(input.email, input.password);
      await api.me.updateProfile({
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`.trim(),
        phone: input.mobile,
        whatsapp_number: input.whatsapp ?? null,
        home_address: input.homeAddress ?? null,
      });
      await api.me.submitIdentity({
        idType: input.idType,
        idNumber: input.idNumber,
        idCountry: input.idCountry ?? (input.idType === 'sa_id' ? 'South Africa' : null),
      });
      await refresh();
    },
    [refresh, upgradeWithEmail],
  );

  const registerPractitioner = useCallback(
    async (input: RegisterPractitioner) => {
      await upgradeWithEmail(input.email, input.password);
      await api.me.updateProfile({
        first_name: input.firstName,
        last_name: input.lastName,
        full_name: `${input.firstName} ${input.lastName}`.trim(),
        phone: input.mobile,
        whatsapp_number: input.whatsapp ?? null,
        home_address: input.homeAddress ?? null,
      });
      await api.me.submitIdentity({
        idType: input.idType,
        idNumber: input.idNumber,
        idCountry: input.idCountry ?? (input.idType === 'sa_id' ? 'South Africa' : null),
      });
      // Sets is_practitioner + payshap + base location + trial subscription. Business profile
      // (name/bio/categories) was already saved during anonymous Studio setup.
      await api.practitioner.finalize({
        payshapProxy: input.payshapProxy,
        lat: input.workCoords.latitude,
        lng: input.workCoords.longitude,
        address: input.workAddress ?? null,
      });
      await refresh();
    },
    [refresh, upgradeWithEmail],
  );

  const finalizePractitioner = useCallback(
    async (input: { payshapProxy: string; workCoords: Coords; workAddress?: string | null }) => {
      await api.practitioner.finalize({
        payshapProxy: input.payshapProxy,
        lat: input.workCoords.latitude,
        lng: input.workCoords.longitude,
        address: input.workAddress ?? null,
      });
      await refresh();
    },
    [refresh],
  );

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Stay browsable: immediately return to an anonymous session.
    await supabase.auth.signInAnonymously();
  }, []);

  const isAnonymous = session?.user?.is_anonymous ?? false;

  const value = useMemo<AuthState>(
    () => ({
      session,
      userId: session?.user?.id ?? null,
      profile,
      practitioner,
      subscription,
      loading,
      ready,
      isAnonymous,
      isAdmin: !!profile?.is_admin,
      isPractitioner: !!profile?.is_practitioner,
      isRegistered: !!session && !isAnonymous,
      refresh,
      registerClient,
      registerPractitioner,
      loginWithPassword,
      finalizePractitioner,
      signOut,
    }),
    [
      session,
      profile,
      practitioner,
      subscription,
      loading,
      ready,
      isAnonymous,
      refresh,
      registerClient,
      registerPractitioner,
      loginWithPassword,
      finalizePractitioner,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
