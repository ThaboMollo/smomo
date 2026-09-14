import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList } from 'react-native';

import { categoryEmoji, categoryLabel } from '@/lib/categories';
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
              <Row style={{ gap: spacing.md }}>
                <Avatar uri={other?.avatar_url} name={other?.full_name} size={44} />
                <Row style={{ flex: 1, justifyContent: 'space-between' }}>
                  <AppText weight="600">{other?.full_name ?? 'User'}</AppText>
                  <Badge label={`${categoryEmoji(item.category)} ${categoryLabel(item.category)}`} />
                </Row>
              </Row>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState emoji="💬" title="No chats yet" message="Chats appear once you have a confirmed booking." />
        }
      />
    </Screen>
  );
}
