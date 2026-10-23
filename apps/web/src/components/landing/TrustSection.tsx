import { Reveal } from '@/components/landing/Reveal';
import { TRUST_ITEMS } from '@/lib/landing-content';

type IconName = (typeof TRUST_ITEMS)[number]['icon'];

const ICONS: Record<IconName, React.ReactNode> = {
  photos: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <circle cx="9" cy="10" r="2" />
      <path d="M21 16l-5-5-9 9" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  chat: <path d="M21 12a8 8 0 0 1-11.7 7L4 20l1.2-4.6A8 8 0 1 1 21 12z" />,
  pay: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10h18M7 15h3" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  flag: <path d="M5 21V4m0 0h11l-2 4 2 4H5" />,
};

const TONES = ['bg-pink', 'bg-lilac', 'bg-lime'] as const;

export function TrustSection() {
  return (
    <section aria-labelledby="trust-title" className="mx-auto w-full max-w-[80rem] px-5 py-14 sm:px-8 lg:py-24">
      <Reveal className="max-w-3xl">
        <p className="label text-pink-deep">Trust and confidence</p>
        <h2 id="trust-title" className="d-xl mt-3">
          Good work deserves real trust.
        </h2>
        <p className="lead mt-5">Here’s what you can expect from SMOMO today, described as it actually works.</p>
      </Reveal>

      <ul className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {TRUST_ITEMS.map((t, i) => (
          <Reveal as="li" key={t.title} delay={(i % 3) * 80} className="border-t-2 border-ink pt-5">
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-ink ${TONES[i % 3]}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ICONS[t.icon]}
              </svg>
            </span>
            <h3 className="d-md mt-4">{t.title}</h3>
            <p className="mt-2 max-w-[34ch] text-[1.0625rem] leading-relaxed text-ink/85">{t.body}</p>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
