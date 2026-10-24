import type { ReactNode } from 'react';

type Tone = 'ok' | 'warn' | 'danger' | 'neutral';

/** Status metadata. Square-ish on purpose so it reads as data, not as a brand badge. */
export function Tag({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`tag tag-${tone}`}>{children}</span>;
}

const VERIFICATION_TONE: Record<string, Tone> = {
  verified: 'ok',
  pending: 'warn',
  unverified: 'neutral',
  rejected: 'danger',
};

/** The four `verification_status` values, consistently coloured wherever they appear. */
export function VerificationTag({ status }: { status: string | null }) {
  const s = status ?? 'unverified';
  return <Tag tone={VERIFICATION_TONE[s] ?? 'neutral'}>{s}</Tag>;
}
