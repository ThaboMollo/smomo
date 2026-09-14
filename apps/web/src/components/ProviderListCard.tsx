import Link from 'next/link';

import type { PublicProviderListItem } from '@smomo/shared';

import { Avatar, Card, Stars } from '@/components/ui';

export function ProviderListCard({ p }: { p: PublicProviderListItem }) {
  return (
    <Link href={`/pro/${p.slug}`}>
      <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
        <Avatar name={p.business_name} size={56} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{p.business_name ?? 'Provider'}</div>
          <div className="mt-1">
            <Stars rating={p.rating} count={p.rating_count} />
          </div>
          <div className="mt-0.5 text-sm text-text-muted">{p.jobs_done} jobs completed</div>
        </div>
      </Card>
    </Link>
  );
}
