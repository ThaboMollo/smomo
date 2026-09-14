import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { Alert, FlatList, View } from 'react-native';

import { categoryEmoji, categoryLabel, BOOKING_MODE_LABEL } from '@/lib/categories';
import { formatBudget, formatWhen, formatZar, timeLeft } from '@/lib/format';
import { notifyUsers } from '@/lib/push';
import { spacing, useTheme } from '@/lib/theme';
import {
  useAcceptOffer,
  useCancelRequest,
  useRequestWithOffers,
  type OfferWithProvider,
} from '@/data/requests';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Header,
  Loader,
  Row,
  Screen,
  StarRating,
} from '@/ui';

export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { data, isLoading } = useRequestWithOffers(id);
  const acceptOffer = useAcceptOffer();
  const cancelRequest = useCancelRequest();

  if (isLoading) return <Screen><Loader /></Screen>;
  const request = data?.request;
  if (!request) {
    return (
      <Screen>
        <Header title="Request" onBack={() => safeBack()} />
        <EmptyState emoji="🤷" title="Request not found" />
      </Screen>
    );
  }

  const isOpen = request.status === 'open';

  const onAccept = (offer: OfferWithProvider) => {
    Alert.alert(
      'Accept offer',
      `Book ${offer.practitioner?.business_name ?? 'this pro'} for ${formatZar(offer.offered_price_zar)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              const bookingId = await acceptOffer.mutateAsync(offer.id);
              notifyUsers(
                [offer.practitioner_id],
                'Offer accepted 🎉',
                'A client accepted your offer. Open Smomo to see the booking.',
                { url: `/(app)/booking/${bookingId}` },
              );
              router.replace(`/(app)/booking/${bookingId}`);
            } catch (e: any) {
              Alert.alert('Could not accept', e.message ?? 'Try again');
            }
          },
        },
      ],
    );
  };

  const onCancel = () => {
    Alert.alert('Cancel request', 'Stop receiving offers for this request?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel request',
        style: 'destructive',
        onPress: async () => {
          await cancelRequest.mutateAsync(request.id);
          safeBack();
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header title="Your request" onBack={() => safeBack()} />
      <FlatList
        data={data?.offers ?? []}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: spacing.lg }}
        ListHeaderComponent={
          <View style={{ marginBottom: spacing.md }}>
            <Card style={{ marginBottom: spacing.md }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="heading">
                  {categoryEmoji(request.category)} {categoryLabel(request.category)}
                </AppText>
                <Badge
                  label={isOpen ? timeLeft(request.expires_at) : request.status}
                  tone={isOpen ? 'primary' : 'default'}
                />
              </Row>
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                {BOOKING_MODE_LABEL[request.booking_mode]} · {formatWhen(request.scheduled_at)}
              </AppText>
              {request.description ? (
                <AppText variant="body" style={{ marginTop: spacing.sm }}>
                  {request.description}
                </AppText>
              ) : null}
              {formatBudget(request.budget_min, request.budget_max) ? (
                <AppText variant="small" color="textMuted" style={{ marginTop: spacing.sm }}>
                  Your budget: {formatBudget(request.budget_min, request.budget_max)}
                </AppText>
              ) : null}
            </Card>

            <AppText variant="heading">
              Offers {data?.offers.length ? `(${data.offers.length})` : ''}
            </AppText>
            {isOpen ? (
              <AppText variant="small" color="textMuted">
                Pros are being notified. Offers appear here as they come in.
              </AppText>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.md }}>
            <Row style={{ gap: spacing.md }}>
              <Avatar uri={item.provider?.avatar_url} name={item.practitioner?.business_name} size={48} />
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <AppText variant="heading" numberOfLines={1} style={{ flex: 1 }}>
                    {item.practitioner?.business_name ?? item.provider?.full_name ?? 'Pro'}
                  </AppText>
                  {item.practitioner?.verification_status === 'verified' ? (
                    <Badge label="Verified" tone="success" icon="shield-checkmark" />
                  ) : null}
                </Row>
                <StarRating
                  value={item.practitioner?.rating ?? null}
                  count={item.practitioner?.rating_count ?? 0}
                />
                {item.message ? (
                  <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                    “{item.message}”
                  </AppText>
                ) : null}
              </View>
            </Row>
            <Row style={{ justifyContent: 'space-between', marginTop: spacing.md }}>
              <AppText variant="title" weight="700" color="primary">
                {formatZar(item.offered_price_zar)}
              </AppText>
              {isOpen && item.status === 'pending' ? (
                <Button
                  title="Accept"
                  full={false}
                  onPress={() => onAccept(item)}
                  loading={acceptOffer.isPending}
                />
              ) : (
                <Badge label={item.status} tone={item.status === 'accepted' ? 'success' : 'default'} />
              )}
            </Row>
          </Card>
        )}
        ListEmptyComponent={
          isOpen ? (
            <View style={{ paddingVertical: spacing.xl }}>
              <Loader label="Waiting for offers…" />
            </View>
          ) : (
            <EmptyState emoji="⌛" title="No offers" message="This request is no longer open." />
          )
        }
        ListFooterComponent={
          isOpen ? (
            <Button
              title="Cancel request"
              variant="ghost"
              onPress={onCancel}
              style={{ marginTop: spacing.md }}
            />
          ) : null
        }
      />
    </Screen>
  );
}
