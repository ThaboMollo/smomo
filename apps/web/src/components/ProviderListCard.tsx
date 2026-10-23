import Image from 'next/image';
import Link from 'next/link';

import type { PublicProviderListItem } from '@smomo/shared';

import { ArrowUpRight, Stars } from '@/components/ui';
import { SHOW_PUBLIC_RATINGS } from '@/lib/flags';
import { CATEGORY_LABEL, CATEGORY_SLUGS, categoryImage } from '@/lib/catalog';
import { cardPhoto } from '@/lib/images';

/** Photo-first provider card for public listings. */
export function ProviderListCard({ p }: { p: PublicProviderListItem }) {
  const photo = cardPhoto(p.avatar_url) ?? (p.categories[0] ? categoryImage(p.categories[0]) : null);
  const cats = p.categories.map((c) => CATEGORY_LABEL[CATEGORY_SLUGS[c]]).join(' · ');
  return (
    <Link
      href={`/pro/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-[24px] border border-border bg-card p-2 transition-colors hover:border-primary-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-primary-100">
        {photo ? (
          photo.startsWith('/') ? (
            <Image src={photo} alt="" fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          )
        ) : null}
        <span className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-card text-primary-700 transition-colors group-hover:bg-primary group-hover:text-white">
          <ArrowUpRight size={16} />
        </span>
      </div>
      <div className="px-2 pb-2 pt-3">
        <div className="truncate text-[17px] font-medium">{p.business_name ?? 'Provider'}</div>
        <div className="mt-0.5 truncate text-sm text-text-muted">{cats}</div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-sm">
          {SHOW_PUBLIC_RATINGS ? <Stars rating={p.rating} count={p.rating_count} /> : <span className="font-bold text-primary-700">View work ↗</span>}
          {p.min_price != null ? (
            <span className="tnum whitespace-nowrap text-xs text-text-muted sm:text-sm">from R{Number(p.min_price).toLocaleString('en-ZA')}</span>
          ) : SHOW_PUBLIC_RATINGS ? (
            <span className="tnum whitespace-nowrap text-xs text-text-muted sm:text-sm">{p.jobs_done} jobs</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
