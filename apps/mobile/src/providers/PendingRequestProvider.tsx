import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { BookingMode, ServiceCategory } from '@/lib/categories';
import type { Coords } from '@/lib/location';

/** A service request drafted (possibly while anonymous) and published after registration. */
export type PendingRequest = {
  category: ServiceCategory;
  bookingMode: BookingMode;
  coords: Coords;
  description?: string;
  address?: string;
  scheduledAt?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  imageUrl?: string | null;
  targetPractitionerId?: string | null;
  consent?: boolean;
};

type Ctx = {
  draft: PendingRequest | null;
  setDraft: (d: PendingRequest | null) => void;
  clear: () => void;
};

const PendingRequestContext = createContext<Ctx | undefined>(undefined);

export function PendingRequestProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<PendingRequest | null>(null);
  const value = useMemo(() => ({ draft, setDraft, clear: () => setDraft(null) }), [draft]);
  return <PendingRequestContext.Provider value={value}>{children}</PendingRequestContext.Provider>;
}

export function usePendingRequest(): Ctx {
  const ctx = useContext(PendingRequestContext);
  if (!ctx) throw new Error('usePendingRequest must be used within PendingRequestProvider');
  return ctx;
}
