import Link from "next/link";

import { EditorialImage } from "@/components/landing/EditorialImage";
import { Reveal } from "@/components/landing/Reveal";
import { ASSETS } from "@/lib/landing-content";

/**
 * "Made by Apex Motus": the brand-story section. No creator names, quotes or credentials
 * are shown, because none have been supplied or approved. The frames are labelled
 * placeholders for creator portraits and process photography (V08, V09, V10).
 */
export function CreatorStory() {
  return (
    <section aria-labelledby="story-title" className="px-3 sm:px-5">
      <div className="on-ink mx-auto w-full max-w-[84rem] overflow-hidden rounded-[2rem] bg-ink px-5 py-14 text-canvas sm:rounded-[2.75rem] sm:px-10 lg:px-16 lg:py-24">
        <Reveal className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="label text-lime">Made by Apex Motus.</p>
            <h2 id="story-title" className="d-xl mt-3">
              Every great look has someone behind it.
            </h2>
          </div>
          <div className="lg:col-span-4">
            <p className="lead text-canvas/85">
              The hands. The skill. The creativity. The person who just gets it.
            </p>
            <Link href="#talent" className="sm-btn sm-btn--pink mt-6">
              Meet the Creators
              <span aria-hidden className="arrow">
                ↗
              </span>
            </Link>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-2 items-start gap-3 sm:gap-4 lg:mt-16 lg:grid-cols-12 lg:gap-6">
          <Reveal className="col-span-2 lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] sm:aspect-[5/4] lg:aspect-[3/4] lg:rounded-[2rem]">
              <EditorialImage
                asset={ASSETS.creatorPortrait}
                sizes="(min-width: 1024px) 40vw, 100vw"
              />
            </div>
          </Reveal>
          <Reveal delay={90} className="col-span-1 lg:col-span-4 lg:mt-20">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] lg:rounded-[2rem]">
              <EditorialImage
                asset={ASSETS.creatorProcess}
                sizes="(min-width: 1024px) 30vw, 50vw"
              />
            </div>
          </Reveal>
          <Reveal delay={180} className="col-span-1 lg:col-span-3 lg:mt-6">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] lg:aspect-[4/5] lg:rounded-[2rem]">
              <EditorialImage
                asset={ASSETS.creatorWork}
                sizes="(min-width: 1024px) 24vw, 50vw"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
