import Image from 'next/image';
import Link from 'next/link';

import { SmomoLockup, SmomoMark } from '@/components/landing/SmomoMark';

const PERKS = [
  'Browse pros and see their work',
  'Post a request and compare offers',
  'Pay your pro directly',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="smomo-landing min-h-dvh bg-ink p-3 sm:p-5 lg:p-6">
      <div className="mx-auto flex min-h-[calc(100dvh-24px)] max-w-6xl gap-4 rounded-[2rem] bg-bg p-3 sm:min-h-[calc(100dvh-40px)] sm:p-4 lg:min-h-[calc(100dvh-48px)]">
        <aside className="on-ink relative hidden w-[46%] shrink-0 overflow-hidden rounded-[1.5rem] bg-ink lg:block">
          <Image
            src="/editorial/look-hair-updo.webp"
            alt="A woman with a braided updo against a deep red backdrop, hands raised to her hair"
            fill
            priority
            sizes="46vw"
            className="object-cover object-[50%_25%]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-between p-9 text-canvas">
            <Link href="/" aria-label="SMOMO home" className="self-start text-canvas">
              <SmomoLockup markClassName="h-10" />
            </Link>
            <div>
              <p className="font-[family-name:var(--font-display)] text-5xl font-bold leading-[0.98] tracking-[-0.04em]">
                Your look.
                <br />
                Your <span className="text-pink">people.</span>
              </p>
              <ul className="mt-7 space-y-3 text-[1.0625rem]">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <SmomoMark className="h-4 text-lime" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between p-2 lg:justify-end">
            <Link href="/" aria-label="SMOMO home" className="text-ink lg:hidden">
              <SmomoLockup markClassName="h-8" />
            </Link>
            <Link href="/" className="rounded-full px-3 py-2 text-sm font-medium text-text-muted hover:bg-card hover:text-text">
              ← Back to SMOMO
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center px-3 py-8 sm:px-8">
            <div className="w-full max-w-[440px]">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
