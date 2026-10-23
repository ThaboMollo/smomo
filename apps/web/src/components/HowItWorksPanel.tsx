'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useId, useState } from 'react';

const STEPS = {
  clients: {
    title: 'Three steps from wish to booked.',
    steps: [
      ['Post or browse', 'Describe what you need with a photo and budget, or browse pros near you.'],
      ['Get offers', 'Verified pros nearby send a price. Compare ratings and portfolios, accept one.'],
      ['Book and pay', 'Chat to arrange the details and pay the pro directly by PayShap.'],
    ],
    cta: { href: '/app/request/new', label: 'Post a request' },
  },
  pros: {
    title: 'Your studio, your clients, your price.',
    steps: [
      ['Set up your studio', 'Create your profile, list services and upload your portfolio.'],
      ['Go online, get requests', 'Get verified, go online and receive nearby client requests in real time.'],
      ['Deliver and get paid', 'Send offers, complete the job, capture proof and get paid by PayShap.'],
    ],
    cta: { href: '/app/studio', label: 'Become a provider' },
  },
} as const;

type Audience = keyof typeof STEPS;

/** Dark "numbered list" panel with a client / pro toggle and a live example card. */
export function HowItWorksPanel({ initial = 'clients' }: { initial?: Audience }) {
  const [who, setWho] = useState<Audience>(initial);
  const [active, setActive] = useState(1);
  const data = STEPS[who];
  const hid = useId();

  return (
    <section className="grid gap-5 lg:grid-cols-12" aria-labelledby={hid}>
      <div className="flex flex-col gap-7 rounded-[32px] bg-primary-950 p-7 text-white sm:p-12 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.2em] text-accent">● HOW SMOMO WORKS</p>
          <div role="tablist" aria-label="Audience" className="flex rounded-full bg-primary-900 p-1">
            {(['clients', 'pros'] as const).map((k) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={who === k}
                onClick={() => {
                  setWho(k);
                  setActive(1);
                }}
                className={`min-h-[40px] rounded-full px-5 text-sm transition-colors ${who === k ? 'bg-white font-medium text-primary-950' : 'text-primary-300 hover:text-white'}`}
              >
                For {k}
              </button>
            ))}
          </div>
        </div>
        <h2 id={hid} className="max-w-xl text-4xl sm:text-[52px]">
          {data.title}
        </h2>
        <ol className="flex flex-col">
          {data.steps.map(([t, d], i) => {
            const on = i === active;
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  aria-current={on ? 'step' : undefined}
                  className={`flex w-full flex-col gap-1 rounded-[18px] px-4 py-5 text-left transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-6 ${on ? 'bg-primary' : 'hover:bg-primary-900'}`}
                >
                  <span className="flex items-baseline gap-5">
                    <span className={`font-[family-name:var(--font-mono)] text-[13px] ${on ? 'text-primary-200' : 'text-primary-400'}`}>
                      0{i + 1}
                    </span>
                    <span className="text-xl">{t}</span>
                  </span>
                  <span className={`pl-9 text-[15px] sm:max-w-sm sm:pl-0 sm:text-right ${on ? 'text-primary-100' : 'text-primary-300'}`}>
                    {d}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        <Link href={data.cta.href} className="btn btn-light self-start">
          {data.cta.label}
        </Link>
      </div>

      <div className="relative min-h-[420px] overflow-hidden rounded-[32px] lg:col-span-4">
        <Image src="/samples/beautician7.jpg" alt="A make-up artist at work" fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        <div className="absolute inset-x-4 bottom-4 rounded-[22px] bg-card p-5 text-text">
          <div className="text-sm text-text-muted">Example offer · Make-up · Sat 10:00</div>
          <div className="mt-1 font-[family-name:var(--font-heading)] text-3xl">Bridal trial, R850</div>
          <div className="mt-3 flex gap-2 text-sm">
            <span className="flex-1 rounded-full bg-primary py-2.5 text-center font-medium text-white">Accept</span>
            <span className="flex-1 rounded-full border border-border py-2.5 text-center">View profile</span>
          </div>
        </div>
      </div>
    </section>
  );
}
