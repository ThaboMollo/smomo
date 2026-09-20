'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import {
  SERVICE_MODE_LABEL,
  categoryLabel,
  formatTimeAgo,
  formatZar,
} from '@smomo/shared';

import { Avatar, Badge, Card, Stars } from '@/components/ui';
import { api } from '@/lib/api';

export default function ProviderProfile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => api.providers.get(id),
  });

  if (isLoading) return <p className="text-text-muted">Loading…</p>;
  if (!data) return <p className="text-text-muted">Provider not found.</p>;

  const { profile, practitioner, services, portfolio, reviews } = data;
  const requestHref = `/app/request/new?target=${id}&category=${practitioner.categories[0] ?? ''}`;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar name={practitioner.business_name ?? profile.full_name} size={72} />
          {practitioner.is_online ? (
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-card bg-success" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl">
            {practitioner.business_name ?? profile.full_name}
          </h1>
          <div className="mt-1">
            <Stars rating={practitioner.rating} count={practitioner.rating_count} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {practitioner.verification_status === 'verified' ? (
              <Badge tone="success">Verified</Badge>
            ) : (
              <Badge>Unverified</Badge>
            )}
            <Badge>{practitioner.jobs_done} jobs</Badge>
          </div>
        </div>
      </div>

      <p className="text-sm text-text-muted">
        {SERVICE_MODE_LABEL[practitioner.service_mode]}
        {practitioner.service_mode !== 'studio'
          ? ` · travels up to ${practitioner.travel_radius_km} km`
          : ''}
      </p>

      <div className="flex flex-wrap gap-2">
        {practitioner.categories.map((c) => (
          <Badge key={c} tone="primary">
            {categoryLabel(c)}
          </Badge>
        ))}
      </div>

      {practitioner.bio ? <p>{practitioner.bio}</p> : null}

      {/* Portfolio */}
      {portfolio.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg">Portfolio</h2>
          <div className="grid grid-cols-3 gap-2">
            {portfolio.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.image_url}
                alt={p.caption ?? 'Portfolio item'}
                className="aspect-square w-full rounded border border-border object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* Services */}
      {services.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg">Services</h2>
          <Card className="divide-y divide-border p-0">
            {services.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-medium">{s.title}</p>
                  {s.description ? <p className="text-sm text-text-muted">{s.description}</p> : null}
                </div>
                {s.indicative_price_zar != null ? (
                  <span className="tnum whitespace-nowrap font-medium text-primary-700">
                    from {formatZar(s.indicative_price_zar)}
                  </span>
                ) : null}
              </div>
            ))}
          </Card>
        </section>
      ) : null}

      {/* Reviews */}
      {reviews.length > 0 ? (
        <section>
          <h2 className="mb-3 text-lg">Reviews</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.reviewer?.full_name ?? null} size={32} />
                    <span className="font-medium">{r.reviewer?.full_name ?? 'Client'}</span>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                {r.comment ? <p className="mt-2 text-sm text-text-muted">{r.comment}</p> : null}
                <p className="mt-1 text-xs text-text-faint">{formatTimeAgo(r.created_at)}</p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Sticky request CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card p-4">
        <div className="mx-auto max-w-2xl">
          <Link
            href={requestHref}
            className="block w-full rounded border border-primary hover:bg-primary-100 py-3 text-center font-medium text-primary-700 active:bg-primary-200"
          >
            Request a booking
          </Link>
        </div>
      </div>
    </div>
  );
}
