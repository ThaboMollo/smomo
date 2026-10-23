import Link from 'next/link';

import Image from 'next/image';

import { Reveal } from '@/components/landing/Reveal';
import { REQUEST_STEPS, ROUTES } from '@/lib/landing-content';

/**
 * Illustrative preview of the request form. It uses the real field names from the
 * request flow (service, description, where, budget) and shows no offers, names or
 * prices: those would be invented. It is hidden from assistive tech because the
 * numbered steps carry the same information.
 */
function RequestPreview() {
  const field = 'rounded-xl border-2 border-ink/15 bg-canvas/60 px-4 py-3';
  return (
    <div aria-hidden className="relative rotate-1 rounded-[1.75rem] bg-white p-5 shadow-[0_2px_0_0_var(--color-ink)] ring-2 ring-ink sm:p-7">
      <span className="absolute -top-3 right-5 rounded-full bg-ink px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-canvas">
        Illustration
      </span>
      <p className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.04em]">Post your look</p>
      <div className="mt-4 grid gap-3 text-[0.9375rem]">
        <div className={field}>
          <p className="label text-[0.6875rem] text-ink/60">Service</p>
          <p className="mt-0.5 font-medium">Choose a craft</p>
        </div>
        <div className={`${field} min-h-[5.5rem]`}>
          <p className="label text-[0.6875rem] text-ink/60">Describe your look</p>
          <p className="mt-0.5 text-ink/55">Add the style, the occasion and any inspiration…</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={field}>
            <p className="label text-[0.6875rem] text-ink/60">Where</p>
            <p className="mt-0.5 font-medium">Studio or at home</p>
          </div>
          <div className={field}>
            <p className="label text-[0.6875rem] text-ink/60">Budget</p>
            <p className="mt-0.5 font-medium">Optional</p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-dashed border-ink/30 px-4 py-4 text-center text-ink/60">Offers from pros appear here</div>
      </div>
    </div>
  );
}

export function RequestSection() {
  return (
    <section aria-labelledby="request-title" className="px-3 sm:px-5">
      <div className="mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] bg-lilac px-5 py-14 text-ink sm:rounded-[2.75rem] sm:px-10 lg:px-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="label">Post your look</p>
              <h2 id="request-title" className="d-xl mt-3">
                You’ve got the vision. <span className="block">We’ll help you find the person.</span>
              </h2>
              <p className="lead mt-5">
                Know what you want? Share the details, add your inspiration and connect with professionals who can bring it to life.
              </p>
            </Reveal>

            <ol className="mt-10 border-t-2 border-ink">
              {REQUEST_STEPS.map((s, i) => (
                <Reveal as="li" key={s.n} delay={i * 90} className="flex items-start gap-5 border-b-2 border-ink py-5 sm:gap-8 sm:py-6">
                  <span aria-hidden className="font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,5.5rem)] font-bold leading-[0.85] tracking-[-0.06em]">
                    {s.n}
                  </span>
                  <span className="pt-1">
                    <span className="d-md block font-[family-name:var(--font-display)] font-bold tracking-[-0.03em]">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.title}
                    </span>
                    <span className="mt-1 block text-[1.0625rem]">{s.body}</span>
                  </span>
                </Reveal>
              ))}
            </ol>

            <Link href={ROUTES.postRequest} className="sm-btn sm-btn--ink mt-8">
              Post Your Look
              <span aria-hidden className="arrow">
                ↗
              </span>
            </Link>
          </div>

          <Reveal delay={120} className="relative lg:col-span-5 lg:pt-4">
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem] sm:aspect-[16/10] lg:aspect-[4/5] lg:rounded-[2rem]">
              <Image
                src="/editorial/customer-phone.webp"
                alt="A woman on her bed browsing hairstyles on her phone, chin resting on her hand"
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover object-[55%_30%]"
              />
            </div>
            <div className="relative z-10 -mt-24 px-3 sm:-mt-28 sm:px-8 lg:-mt-32 lg:px-4">
              <RequestPreview />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
