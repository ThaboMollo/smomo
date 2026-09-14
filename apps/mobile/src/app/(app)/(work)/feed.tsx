import { router } from 'expo-router';
import { Switch, View } from 'react-native';
import { FlatList } from 'react-native';

import { categoryEmoji, categoryLabel, BOOKING_MODE_LABEL } from '@/lib/categories';
import { formatBudget, formatDistance, formatWhen, timeLeft } from '@/lib/format';
import { spacing, useTheme } from '@/lib/theme';
import { usePractitionerFeed } from '@/data/requests';
import { useToggleOnline } from '@/data/practitioner';
import { useAuth } from '@/providers/AuthProvider';
import {
  AppText,
  Badge,
  Button,
  Card,
  EmptyState,
  Loader,
  Row,
  Screen,
  StarRating,
} from '@/ui';

export default function Feed() {
  const { colors } = useTheme();
  const { practitioner, subscription } = useAuth();
  const toggleOnline = useToggleOnline();

  const verified = practitioner?.verification_status === 'verified';
  const online = !!practitioner?.is_online;
  const subActive = subscription?.status === 'trialing' || subscription?.status === 'active';

  const feed = usePractitionerFeed(!!practitioner && verified && online && subActive);

  return (
    <Screen edges={['top']} padded={false}>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
        <AppText variant="title" weight="700">
          Requests
        </AppText>
      </View>

      {/* Online toggle */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <Card style={{ backgroundColor: online ? colors.successSoft : colors.card }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText weight="600">{online ? "You're online" : "You're offline"}</AppText>
              <AppText variant="small" color="textMuted">
                {online ? 'Receiving nearby client requests' : 'Go online to receive requests'}
              </AppText>
            </View>
            <Switch
              value={online}
              disabled={!subActive || toggleOnline.isPending}
              onValueChange={(v) => toggleOnline.mutate(v)}
              trackColor={{ true: colors.online }}
            />
          </Row>
        </Card>
      </View>

      {/* Banners */}
      {!verified ? (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Card style={{ backgroundColor: colors.warningSoft, borderColor: colors.warningSoft }}>
            <AppText weight="600" color="warning">
              Verification pending
            </AppText>
            <AppText variant="small" color="textMuted">
              You can appear in search, but you can't accept bookings until your ID is verified.
            </AppText>
          </Card>
        </View>
      ) : null}
      {!subActive ? (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
          <Card style={{ backgroundColor: colors.dangerSoft, borderColor: colors.dangerSoft }}>
            <AppText weight="600" color="danger">
              Subscription inactive
            </AppText>
            <AppText variant="small" color="textMuted">
              An active subscription is required to go online.
            </AppText>
          </Card>
        </View>
      ) : null}

      {!online ? (
        <EmptyState emoji="💤" title="You're offline" message="Flip the switch above to start receiving requests." />
      ) : feed.isLoading ? (
        <Loader label="Loading requests…" />
      ) : (
        <FlatList
          data={feed.data ?? []}
          keyExtractor={(r) => r.request_id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: 0, flexGrow: 1 }}
          onRefresh={feed.refetch}
          refreshing={feed.isRefetching}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: spacing.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="heading">
                  {categoryEmoji(item.category)} {categoryLabel(item.category)}
                </AppText>
                <Badge label={timeLeft(item.expires_at)} tone="primary" />
              </Row>
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                {BOOKING_MODE_LABEL[item.booking_mode]} · {formatDistance(item.distance_km)} away ·{' '}
                {formatWhen(item.scheduled_at)}
              </AppText>
              {item.description ? (
                <AppText variant="body" style={{ marginTop: spacing.sm }}>
                  {item.description}
                </AppText>
              ) : null}
              <Row style={{ justifyContent: 'space-between', marginTop: spacing.sm }}>
                <Row style={{ gap: spacing.sm }}>
                  <AppText variant="small" color="textMuted">
                    {item.client_name ?? 'Client'}
                  </AppText>
                  <StarRating value={item.client_rating} size={12} />
                </Row>
                {formatBudget(item.budget_min, item.budget_max) ? (
                  <AppText variant="small" color="textMuted">
                    Budget {formatBudget(item.budget_min, item.budget_max)}
                  </AppText>
                ) : null}
              </Row>
              <View style={{ marginTop: spacing.md }}>
                {item.has_offered ? (
                  <Badge label="Offer sent" tone="success" icon="checkmark" />
                ) : (
                  <Button
                    title="Make an offer"
                    icon="pricetag"
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/offer/[id]',
                        params: {
                          id: item.request_id,
                          category: item.category,
                          budgetMin: item.budget_min != null ? String(item.budget_min) : '',
                          budgetMax: item.budget_max != null ? String(item.budget_max) : '',
                          description: item.description ?? '',
                          clientId: item.client_id,
                        },
                      })
                    }
                  />
                )}
              </View>
            </Card>
          )}
          ListEmptyComponent={
            <EmptyState emoji="🕊️" title="No open requests" message="New matching requests will appear here in real time." />
          }
        />
      )}
    </Screen>
  );
}
