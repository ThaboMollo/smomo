import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, View } from 'react-native';

import { categoryEmoji, categoryLabel } from '@/lib/categories';
import { formatBudget, formatWhen, formatZar, timeLeft } from '@/lib/format';
import { spacing } from '@/lib/theme';
import { useMyBookings } from '@/data/bookings';
import { useMyRequests } from '@/data/requests';
import { AppText, Avatar, Badge, Card, EmptyState, Row, Screen, Segmented } from '@/ui';

const BOOKING_TONE = {
  confirmed: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
} as const;

export default function Activity() {
  const [tab, setTab] = useState<'requests' | 'bookings'>('bookings');
  const requests = useMyRequests();
  const bookings = useMyBookings('client');

  return (
    <Screen edges={['top']} padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <AppText variant="title" weight="700">
          Activity
        </AppText>
      </View>
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'bookings', label: 'Bookings' },
            { value: 'requests', label: 'Requests' },
          ]}
        />
      </View>

      {tab === 'bookings' ? (
        <FlatList
          data={bookings.data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
          onRefresh={bookings.refetch}
          refreshing={bookings.isRefetching}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/(app)/booking/${item.id}`)} style={{ marginBottom: spacing.sm }}>
              <Row style={{ gap: spacing.md }}>
                <Avatar uri={item.practitioner?.avatar_url} name={item.practitioner?.full_name} size={44} />
                <View style={{ flex: 1 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <AppText weight="600" numberOfLines={1} style={{ flex: 1 }}>
                      {item.practitioner?.full_name ?? 'Provider'}
                    </AppText>
                    <Badge label={item.status.replace('_', ' ')} tone={BOOKING_TONE[item.status]} />
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
            <EmptyState emoji="📅" title="No bookings yet" message="Post a request or browse providers to get started." />
          }
        />
      ) : (
        <FlatList
          data={requests.data ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
          onRefresh={requests.refetch}
          refreshing={requests.isRefetching}
          renderItem={({ item }) => (
            <Card onPress={() => router.push(`/(app)/request/${item.id}`)} style={{ marginBottom: spacing.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText weight="600">
                  {categoryEmoji(item.category)} {categoryLabel(item.category)}
                </AppText>
                <Badge
                  label={item.status === 'open' ? timeLeft(item.expires_at) : item.status}
                  tone={item.status === 'open' ? 'primary' : 'default'}
                />
              </Row>
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                {formatWhen(item.scheduled_at)}
                {formatBudget(item.budget_min, item.budget_max) ? ` · budget ${formatBudget(item.budget_min, item.budget_max)}` : ''}
              </AppText>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState emoji="📣" title="No requests" message="Post a request and nearby pros will send you offers." />
          }
        />
      )}
    </Screen>
  );
}
