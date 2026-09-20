import type { Metadata } from 'next';
import Image from 'next/image';

import { Button, Card, Container, Hairline, Kicker, Badge } from '@/components/ui';
import { APP_DOWNLOAD } from '@/lib/app-download';
import { SITE_NAME } from '@/lib/env';

export const metadata: Metadata = {
  title: 'Get the Android app',
  description:
    'Download the Smomo Android app (APK) to book beauty, hair, nails, make-up and tattoo pros near you — or install the web app to your home screen.',
  alternates: { canonical: '/download' },
};

const FEATURES = [
  ['Book on the go', 'Post a request or browse verified pros from anywhere, anytime.'],
  ['Chat & coordinate', 'Message pros, agree on details and share reference photos.'],
  ['Pay by PayShap', 'Settle deposits instantly, peer-to-peer, and confirm in-app.'],
  ['Real portfolios', 'Every completed job adds a proof photo — see genuine work.'],
];

export default function DownloadPage() {
  const { available, version, url, sizeMb, minAndroid, releasedOn } = APP_DOWNLOAD;

  return (
    <>
      {/* Hero */}
      <Container className="grid items-center gap-10 py-16 md:grid-cols-2">
        <div>
          <Kicker>Android app</Kicker>
          <h1 className="mt-4 text-4xl sm:text-5xl">Smomo, on your phone.</h1>
          <p className="mt-5 max-w-prose text-lg leading-relaxed text-text-muted">
            Download the {SITE_NAME} Android app to book beauty, hair, nails, make-up and tattoo
            pros near you — with chat, offers and PayShap deposits built in.
          </p>
          <Hairline className="my-8" />

          {available ? (
            <div className="flex flex-col gap-3">
              <a
                href={url}
                download
                className="inline-flex w-fit items-center justify-center gap-2 rounded border border-primary bg-primary-100 px-6 py-3.5 text-sm text-primary-700 transition-colors hover:bg-primary-200 active:bg-primary-300"
              >
                ⬇ Download APK
                <span className="tnum text-xs text-text-muted">
                  v{version}
                  {sizeMb ? ` · ${sizeMb} MB` : ''}
                </span>
              </a>
              <p className="text-xs text-text-faint">
                Android {minAndroid}+{releasedOn ? ` · Released ${releasedOn}` : ''}. Not on Google
                Play yet — you&rsquo;ll install it directly (steps below).
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="inline-flex w-fit items-center gap-2">
                <Badge tone="primary">Coming soon</Badge>
                <span className="text-sm text-text-muted">
                  The Android download lands here shortly.
                </span>
              </div>
              <p className="text-sm text-text-muted">
                Meanwhile, you can install the web app to your home screen right now — it works just
                like a native app.
              </p>
              <Button href="/" variant="outline" className="w-fit">
                Open the web app
              </Button>
            </div>
          )}
        </div>

        {/* App mark plate */}
        <div className="plate">
          <div className="flex aspect-[4/3] flex-col items-center justify-center gap-6 bg-primary-900 p-8">
            <Image
              src="/icons/icon-512.png"
              alt="Smomo app icon"
              width={160}
              height={160}
              priority
              className="rounded-[22%] shadow-lg"
            />
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em] text-accent">
              Beauty, booked to you
            </p>
          </div>
        </div>
      </Container>

      {/* Features */}
      <Container className="py-8">
        <h2 className="text-2xl">What you get</h2>
        <Hairline className="mb-6 mt-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map(([t, d]) => (
            <Card key={t} className="h-full">
              <div className="font-[family-name:var(--font-heading)] text-xl">{t}</div>
              <p className="mt-2 text-sm text-text-muted">{d}</p>
            </Card>
          ))}
        </div>
      </Container>

      {/* Install instructions */}
      <Container className="py-14">
        <h2 className="text-2xl">Installing the APK</h2>
        <Hairline className="mb-2 mt-4" />
        <div className="grid sm:grid-cols-3">
          {[
            ['01', 'Download', 'Tap “Download APK” above and let the file finish downloading.'],
            [
              '02',
              'Allow install',
              'Open the file. If prompted, allow your browser to “install unknown apps” — this is normal for apps outside the Play Store.',
            ],
            ['03', 'Open Smomo', 'Tap Install, then Open. Sign in and you’re ready to book.'],
          ].map(([n, t, d]) => (
            <div
              key={n}
              className="border-border py-6 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0"
            >
              <span className="tnum font-[family-name:var(--font-mono)] text-[10px] tracking-[0.18em] text-primary-700">
                {n}
              </span>
              <h3 className="mt-2 text-xl">{t}</h3>
              <p className="mt-2 leading-relaxed text-text-muted">{d}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 max-w-prose text-sm text-text-faint">
          On iPhone or don&rsquo;t want to sideload? Open{' '}
          <a href="/" className="text-primary-700 underline">
            smomo on the web
          </a>{' '}
          and use “Add to Home Screen” — you get the same app experience, no download required.
        </p>
      </Container>
    </>
  );
}
