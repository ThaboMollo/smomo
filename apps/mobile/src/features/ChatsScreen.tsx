import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, View } from 'react-native';

import { CategoryIcon } from '@/components/CategoryIcon';
import { categoryLabel } from '@/lib/categories';
import { formatWhen } from '@/lib/format';
import { spacing } from '@/lib/theme';
import { useMyBookings } from '@/data/bookings';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Avatar, Badge, Card, EmptyState, Row, Screen } from '@/ui';

export function ChatsScreen() {
  const { userId } = useAuth();
  const asClient = useMyBookings('client');
  const asPractitioner = useMyBookings('practitioner');

  const bookings = useMemo(() => {
    const all = [...(asClient.data ?? []), ...(asPractitioner.data ?? [])];
    const seen = new Set<string>();
    return all
      .filter((b) => (seen.has(b.id) ? false : (seen.add(b.id), true)))
      .filter((b) => b.status !== 'cancelled')
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [asClient.data, asPractitioner.data]);

  return (
    <Screen edges={['top']} padded={false}>
      <AppText variant="title" weight="700" style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        Chats
      </AppText>
      <FlatList
        data={bookings}
        keyExtractor={(b) => b.id}
        contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
        renderItem={({ item }) => {
          const other = item.client_id === userId ? item.practitioner : item.client;
          return (
            <Card onPress={() => router.push(`/(app)/chat/${item.id}`)} style={{ marginBottom: spacing.sm }}>
              <Row style={{ gap: spacing.md, alignItems: 'flex-start' }}>
                <Avatar uri={other?.avatar_url} name={other?.full_name} size={44} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Row style={{ justifyContent: 'space-between', gap: spacing.sm }}>
                    <AppText weight="500" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {other?.full_name ?? 'User'}
                    </AppText>
                    <Badge
                      label={item.status.replace('_', ' ')}
                      tone={item.status === 'completed' ? 'success' : 'primary'}
                    />
                  </Row>
                  <Row style={{ gap: 6 }}>
                    <CategoryIcon category={item.category} size={14} />
                    <AppText variant="small" color="textMuted" numberOfLines={1} style={{ flexShrink: 1 }}>
                      {categoryLabel(item.category)} · {formatWhen(item.scheduled_at)}
                    </AppText>
                  </Row>
                </View>
              </Row>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState title="No chats yet" body="Chats appear once you have a confirmed booking." />
        }
      />
    </Screen>
  );
}
