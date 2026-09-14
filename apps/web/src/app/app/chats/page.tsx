'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { categoryEmoji, categoryLabel, formatWhen, type BookingWithParties } from '@smomo/shared';

import { Avatar, Badge, Card } from '@/components/ui';
import { api } from '@/lib/api';
import { useMe } from '@/lib/use-me';

export default function Chats() {
  const me = useMe();
  const isPractitioner = !!me.data?.profile?.is_practitioner;

  const asClient = useQuery({
    queryKey: ['chats', 'client'],
    queryFn: () => api.bookings.mine('client'),
  });
  const asPractitioner = useQuery({
    queryKey: ['chats', 'practitioner'],
    queryFn: () => api.bookings.mine('practitioner'),
    enabled: isPractitioner,
  });

  // Merge both roles, de-dupe, newest first. Each booking is a conversation.
  const map = new Map<string, { booking: BookingWithParties; asClient: boolean }>();
  for (const b of asClient.data ?? []) map.set(b.id, { booking: b, asClient: true });
  for (const b of asPractitioner.data ?? []) if (!map.has(b.id)) map.set(b.id, { booking: b, asClient: false });
  const conversations = [...map.values()].sort(
    (a, b) => new Date(b.booking.created_at).getTime() - new Date(a.booking.created_at).getTime(),
  );

  if (asClient.isLoading) return <p className="text-text-muted">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Chats</h1>
      <div className="space-y-3">
        {conversations.map(({ booking: b, asClient: iAmClient }) => {
          const other = iAmClient ? b.practitioner : b.client;
          return (
            <Link key={b.id} href={`/app/booking/${b.id}`}>
              <Card className="flex items-center gap-4 transition-shadow hover:shadow-md">
                <Avatar name={other?.full_name ?? null} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">
                      {other?.full_name ?? (iAmClient ? 'Provider' : 'Client')}
                    </span>
                    <Badge tone={b.status === 'completed' ? 'success' : 'primary'}>
                      {b.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-muted">
                    {categoryEmoji(b.category)} {categoryLabel(b.category)} · {formatWhen(b.scheduled_at)}
                  </p>
                </div>
              </Card>
            </Link>
          );
        })}
        {conversations.length === 0 ? (
          <p className="text-text-muted">
            No conversations yet. Chats open once you have a booking with a pro or client.
          </p>
        ) : null}
      </div>
    </div>
  );
}
