import Link from 'next/link';

import { categoryLabel, formatDistance, formatZar, type ProviderCard } from '@smomo/shared';

import { CategoryIcon } from '@/components/CategoryIcon';
import { Avatar, Badge, Card, Stars } from '@/components/ui';

export function DiscoverProviderCard({ p }: { p: ProviderCard }) {
  return (
    <Link href={`/app/provider/${p.id}`}>
      <Card className="flex items-center gap-4 transition-colors hover:bg-primary-100">
        <div className="relative">
          <Avatar name={p.business_name} size={56} />
          {p.is_online ? (
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-card bg-success" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-medium">{p.business_name ?? 'Provider'}</span>
            {p.verification_status === 'verified' ? <Badge tone="success">Verified</Badge> : null}
          </div>
          <div className="mt-1">
            <Stars rating={p.rating} count={p.rating_count} />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              {p.categories[0] ? <CategoryIcon category={p.categories[0]} size={14} /> : null}
              {p.categories.map((c) => categoryLabel(c)).join(' · ')}
            </span>
            <span className="tnum">· {formatDistance(p.distance_km)} away</span>
            {p.min_price != null ? <span className="tnum">· from {formatZar(p.min_price)}</span> : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
