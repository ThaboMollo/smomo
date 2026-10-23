import Image from 'next/image';

import { Reveal } from '@/components/landing/Reveal';
import { SmomoMark } from '@/components/landing/SmomoMark';

/** Expressive pause before the footer. Ink on Signature Pink (4.7:1) at display size. */
export function BrandStatement() {
  return (
    <section aria-labelledby="statement" className="mt-14 px-3 sm:px-5 lg:mt-24">
      <div className="relative mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] bg-pink px-5 pb-5 pt-14 text-ink sm:rounded-[2.75rem] sm:px-10 sm:pb-8 sm:pt-16 lg:px-16 lg:pt-24">
        <SmomoMark size="lg" className="pointer-events-none absolute -right-[8%] -top-[6%] w-[44%] rotate-[8deg] text-canvas/45 sm:w-[34%] lg:-right-[3%] lg:-top-[10%] lg:w-[24%]" />
        <Reveal className="relative">
          <h2 id="statement" className="d-xl max-w-[18ch] text-balance !text-[clamp(2.25rem,8vw,5.75rem)]">
            It’s more than a look. <span className="block">It’s the person behind it.</span>
          </h2>
        </Reveal>
        <Reveal delay={120} className="relative mt-10 lg:mt-14">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] sm:aspect-[16/9] lg:aspect-[21/9] lg:rounded-[2rem]">
            <Image
              src="/editorial/community-trio.webp"
              alt="Three women with different hairstyles, posed together against a deep burgundy backdrop"
              fill
              sizes="(min-width: 1344px) 1200px, 100vw"
              className="object-cover object-[50%_35%]"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
