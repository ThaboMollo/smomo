import Link from 'next/link';

import { categoryLabel, formatDistance, formatZar, type ProviderCard } from '@smomo/shared';


import { Stars } from '@/components/ui';
import { categoryImage } from '@/lib/catalog';
import { cardPhoto } from '@/lib/images';

export function DiscoverProviderCard({ p }: { p: ProviderCard }) {
  const photo = cardPhoto(p.avatar_url, 320) ?? (p.categories[0] ? categoryImage(p.categories[0]) : null);
  return (
    <Link
      href={`/app/provider/${p.id}`}
      className="flex gap-3 rounded-[24px] border border-border bg-card p-2.5 transition-colors hover:border-primary-300"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[18px] bg-primary-100">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 pr-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{p.business_name ?? 'Provider'}</span>
          {p.is_online ? (
            <span className="relative flex h-2 w-2 shrink-0" title="Online now">
              <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-success" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              <span className="sr-only">Online now</span>
            </span>
          ) : null}
          {p.verification_status === 'verified' ? (
            <span className="ml-auto shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700">Verified</span>
          ) : null}
        </div>
        <div className="truncate text-sm text-text-muted">
          {p.categories.map((c) => categoryLabel(c)).join(' · ')}
          {/* Null distance means the match was by city, not by point (migration 16): show
              nothing rather than a number we'd be inventing. */}
          {p.distance_km != null ? (
            <span className="tnum"> · {formatDistance(p.distance_km)} away</span>
          ) : null}
        </div>
        <div className="flex items-center justify-between text-sm">
          <Stars rating={p.rating} count={p.rating_count} />
          {p.min_price != null ? (
            <span className="tnum font-medium text-primary-700">from {formatZar(p.min_price)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
