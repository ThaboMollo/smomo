import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, View } from 'react-native';

import { categoryEmoji, categoryLabel } from '@/lib/categories';
import { formatWhen, formatZar } from '@/lib/format';
import { spacing } from '@/lib/theme';
import { useMyBookings } from '@/data/bookings';
import { AppText, Avatar, Badge, Card, EmptyState, Row, Screen, Segmented } from '@/ui';

const TONE = {
  confirmed: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
} as const;

export default function Schedule() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const bookings = useMyBookings('practitioner');

  const filtered = useMemo(() => {
    const all = bookings.data ?? [];
    if (tab === 'upcoming') return all.filter((b) => b.status === 'confirmed' || b.status === 'in_progress');
    return all.filter((b) => b.status === 'completed' || b.status === 'cancelled');
  }, [bookings.data, tab]);

  return (
    <Screen edges={['top']} padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <AppText variant="title" weight="700">
          Schedule
        </AppText>
      </View>
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'past', label: 'Past' },
          ]}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
        onRefresh={bookings.refetch}
        refreshing={bookings.isRefetching}
        renderItem={({ item }) => (
          <Card onPress={() => router.push(`/(app)/booking/${item.id}`)} style={{ marginBottom: spacing.sm }}>
            <Row style={{ gap: spacing.md }}>
              <Avatar uri={item.client?.avatar_url} name={item.client?.full_name} size={44} />
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <AppText weight="600" numberOfLines={1} style={{ flex: 1 }}>
                    {item.client?.full_name ?? 'Client'}
                  </AppText>
                  <Badge label={item.status.replace('_', ' ')} tone={TONE[item.status]} />
                </Row>
                <AppText variant="small" color="textMuted">
                  {categoryEmoji(item.category)} {categoryLabel(item.category)} · {formatZar(item.final_price_zar)}
                </AppText>
                <AppText variant="caption" color="textFaint">
                  {formatWhen(item.scheduled_at)}
                </AppText>
              </View>
            </Row>
          </Card>
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🗓️"
            title={tab === 'upcoming' ? 'No upcoming jobs' : 'No past jobs'}
            message={tab === 'upcoming' ? 'Accepted bookings show up here.' : undefined}
          />
        }
      />
    </Screen>
  );
}
