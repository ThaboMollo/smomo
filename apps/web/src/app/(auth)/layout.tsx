import Image from 'next/image';
import Link from 'next/link';

import { BrandLogo } from '@/components/BrandLogo';
import { Sparkle } from '@/components/ui';

const PERKS = [
  'Offers from ID-verified pros near you',
  'Chat and pay the pro directly by PayShap',
  'Free to join, as a client or a pro',
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-primary-950 p-3 sm:p-6 lg:p-10">
      <div className="mx-auto flex min-h-[calc(100dvh-24px)] max-w-6xl gap-4 rounded-[32px] bg-card p-3 sm:min-h-[calc(100dvh-48px)] sm:p-4 lg:min-h-[calc(100dvh-80px)]">
        <aside className="relative hidden w-[46%] shrink-0 overflow-hidden rounded-[24px] bg-primary-950 lg:block">
          <Image
            src="/samples/beautician7.jpg"
            alt=""
            fill
            priority
            sizes="46vw"
            className="object-cover opacity-60"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-950/50 to-primary-950/20" />
          <div className="absolute inset-0 flex flex-col justify-between p-10 text-white">
            <Link href="/" aria-label="Smomo home" className="self-start">
              {/* The light-ink logo reads on the deep panel in both themes */}
              <Image src="/assets/Smomo_logo_dark_nav.png" alt="Smomo" width={322} height={103} className="h-11 w-auto" />
            </Link>
            <div>
              <p className="font-[family-name:var(--font-heading)] text-5xl leading-[1.02]">
                Your next appointment is one request away.
              </p>
              <ul className="mt-7 space-y-3 text-[15px]">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <Sparkle size={14} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between p-2 lg:justify-end">
            <Link href="/" aria-label="Smomo home" className="lg:hidden">
              <BrandLogo className="h-8 w-auto" priority />
            </Link>
            <Link href="/" className="rounded-full px-3 py-2 text-sm text-text-muted hover:bg-primary-100 hover:text-text">
              ← Back to Smomo
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
