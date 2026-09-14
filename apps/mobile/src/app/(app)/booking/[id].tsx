import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { Alert, Linking, ScrollView, View } from 'react-native';

import { BOOKING_MODE_LABEL, categoryEmoji, categoryLabel } from '@/lib/categories';
import { formatWhen, formatZar } from '@/lib/format';
import { notifyUsers } from '@/lib/push';
import { spacing, useTheme } from '@/lib/theme';
import { useProviderDetail } from '@/data/discovery';
import {
  useBooking,
  useCancelBooking,
  useMarkPaid,
  useStartBooking,
  useVerifyPayment,
  type Payment,
} from '@/data/bookings';
import { useAuth } from '@/providers/AuthProvider';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Header,
  Input,
  Ionicons,
  Loader,
  Row,
  Screen,
} from '@/ui';

const STATUS_TONE = {
  confirmed: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
} as const;

export default function BookingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { data, isLoading } = useBooking(id);

  const { data: provider } = useProviderDetail(data?.booking.practitioner_id);
  const payshap = provider?.practitioner.payshap_proxy ?? null;

  const startBooking = useStartBooking();
  const cancelBooking = useCancelBooking();

  if (isLoading) return <Screen><Loader /></Screen>;
  if (!data) {
    return (
      <Screen>
        <Header title="Booking" onBack={() => safeBack()} />
        <AppText style={{ padding: spacing.lg }}>Booking not found.</AppText>
      </Screen>
    );
  }

  const { booking, payments, reviews } = data;
  const isClient = booking.client_id === userId;
  const other = isClient ? booking.practitioner : booking.client;
  const myC2pDone = reviews.some((r) => r.direction === 'c2p');

  const onCancel = () =>
    Alert.alert('Cancel booking', 'Are you sure?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: () =>
          cancelBooking.mutate({ id: booking.id, reason: isClient ? 'Cancelled by client' : 'Cancelled by practitioner' }),
      },
    ]);

  return (
    <Screen>
      <Header title="Booking" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Status */}
        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.md }}>
          <AppText variant="heading">
            {categoryEmoji(booking.category)} {categoryLabel(booking.category)}
          </AppText>
          <Badge label={booking.status.replace('_', ' ')} tone={STATUS_TONE[booking.status]} />
        </Row>

        {/* Other party */}
        <Card style={{ marginBottom: spacing.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: spacing.md, flex: 1 }}>
              <Avatar uri={other?.avatar_url} name={other?.full_name} size={48} />
              <View style={{ flex: 1 }}>
                <AppText weight="600">{other?.full_name ?? (isClient ? 'Practitioner' : 'Client')}</AppText>
                <AppText variant="small" color="textMuted">
                  {isClient ? 'Your provider' : 'Your client'}
                </AppText>
              </View>
            </Row>
            <Row style={{ gap: spacing.md }}>
              <Ionicons
                name="chatbubble-ellipses"
                size={24}
                color={colors.primary}
                onPress={() => router.push(`/(app)/chat/${booking.id}`)}
              />
              {other?.phone ? (
                <Ionicons
                  name="call"
                  size={22}
                  color={colors.primary}
                  onPress={() => Linking.openURL(`tel:${other.phone}`)}
                />
              ) : null}
            </Row>
          </Row>
        </Card>

        {/* Details */}
        <Card style={{ marginBottom: spacing.md, gap: 6 }}>
          <DetailRow label="When" value={formatWhen(booking.scheduled_at)} />
          <DetailRow label="Where" value={BOOKING_MODE_LABEL[booking.booking_mode]} />
          {booking.address ? <DetailRow label="Address" value={booking.address} /> : null}
          <DetailRow label="Agreed price" value={formatZar(booking.final_price_zar)} />
          {booking.deposit_amount_zar ? (
            <DetailRow label="Deposit" value={formatZar(booking.deposit_amount_zar)} />
          ) : null}
        </Card>

        {/* Payments */}
        <AppText variant="heading" style={{ marginBottom: spacing.sm }}>
          Payment (PayShap)
        </AppText>
        {payments.map((p) => (
          <PaymentCard
            key={p.id}
            payment={p}
            isClient={isClient}
            bookingId={booking.id}
            payshapProxy={payshap ?? null}
          />
        ))}

        {/* Actions */}
        <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
          {!isClient && booking.status === 'confirmed' ? (
            <Button title="Start job" icon="play" onPress={() => startBooking.mutate(booking.id)} />
          ) : null}
          {!isClient && booking.status === 'in_progress' ? (
            <Button
              title="Complete & add proof"
              icon="camera"
              onPress={() => router.push(`/(app)/complete/${booking.id}`)}
            />
          ) : null}
          {isClient && booking.status === 'completed' && !myC2pDone ? (
            <Button
              title="Leave a review"
              icon="star"
              onPress={() => router.push(`/(app)/review/${booking.id}`)}
            />
          ) : null}
          {booking.status === 'confirmed' || booking.status === 'in_progress' ? (
            <Button title="Cancel booking" variant="ghost" onPress={onCancel} />
          ) : null}
          <Button
            title="Report a problem"
            variant="ghost"
            onPress={() =>
              router.push({
                pathname: '/(app)/report',
                params: { userId: other?.id, bookingId: booking.id },
              })
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <AppText variant="small" color="textMuted">
        {label}
      </AppText>
      <AppText variant="small" weight="600" style={{ flex: 1, textAlign: 'right' }}>
        {value}
      </AppText>
    </Row>
  );
}

function PaymentCard({
  payment,
  isClient,
  bookingId,
  payshapProxy,
}: {
  payment: Payment;
  isClient: boolean;
  bookingId: string;
  payshapProxy: string | null;
}) {
  const { colors } = useTheme();
  const markPaid = useMarkPaid();
  const verifyPayment = useVerifyPayment();
  const [reference, setReference] = useState('');

  const tone =
    payment.status === 'verified'
      ? 'success'
      : payment.status === 'disputed'
        ? 'danger'
        : payment.status === 'rejected'
          ? 'warning'
          : 'default';

  return (
    <Card style={{ marginBottom: spacing.sm }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <AppText weight="600">
          {payment.payment_type === 'deposit'
            ? 'Deposit'
            : payment.payment_type === 'balance'
              ? 'Balance'
              : 'Payment'}{' '}
          · {formatZar(payment.amount_zar)}
        </AppText>
        <Badge label={payment.status} tone={tone} />
      </Row>

      {/* Client, unpaid */}
      {isClient && payment.status === 'pending' && !payment.marked_paid_at ? (
        <View style={{ marginTop: spacing.sm }}>
          <AppText variant="small" color="textMuted">
            Pay {formatZar(payment.amount_zar)} via your banking app's PayShap to:
          </AppText>
          <AppText variant="heading" color="primary" style={{ marginVertical: 4 }}>
            {payshapProxy ?? '—'}
          </AppText>
          <Input
            placeholder="PayShap reference"
            value={reference}
            onChangeText={setReference}
            style={{ marginTop: spacing.sm }}
          />
          <Button
            title="I've paid"
            icon="checkmark"
            loading={markPaid.isPending}
            onPress={() => {
              markPaid.mutate({ paymentId: payment.id, reference: reference.trim(), bookingId });
              notifyUsers(
                [payment.payee_id],
                'Client marked a payment as paid',
                `Please verify the ${formatZar(payment.amount_zar)} PayShap payment.`,
                { url: `/(app)/booking/${bookingId}` },
              );
            }}
          />
        </View>
      ) : null}

      {/* Client, marked paid, awaiting */}
      {isClient && payment.status === 'pending' && payment.marked_paid_at ? (
        <AppText variant="small" color="textMuted" style={{ marginTop: spacing.sm }}>
          Awaiting the provider to verify your payment (ref {payment.payshap_reference}).
        </AppText>
      ) : null}

      {/* Practitioner, client marked paid */}
      {!isClient && payment.status === 'pending' && payment.marked_paid_at ? (
        <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
          <AppText variant="small" color="textMuted">
            Client marked this paid (ref {payment.payshap_reference}). Confirm you received it?
          </AppText>
          <Row style={{ gap: spacing.sm }}>
            <Button
              title="Verify"
              full={false}
              style={{ flex: 1 }}
              loading={verifyPayment.isPending}
              onPress={() => {
                verifyPayment.mutate({ paymentId: payment.id, verified: true, bookingId });
                notifyUsers(
                  [payment.payer_id],
                  'Payment verified ✅',
                  `Your ${formatZar(payment.amount_zar)} payment was confirmed.`,
                  { url: `/(app)/booking/${bookingId}` },
                );
              }}
            />
            <Button
              title="Not received"
              variant="danger"
              full={false}
              style={{ flex: 1 }}
              onPress={() =>
                verifyPayment.mutate({
                  paymentId: payment.id,
                  verified: false,
                  disputeReason: 'Practitioner reports payment not received',
                  bookingId,
                })
              }
            />
          </Row>
        </View>
      ) : null}

      {payment.status === 'disputed' ? (
        <AppText variant="small" color="danger" style={{ marginTop: spacing.sm }}>
          Disputed — our team is reviewing this payment.
        </AppText>
      ) : null}
      {!isClient && payment.status === 'pending' && !payment.marked_paid_at ? (
        <AppText variant="small" color="textMuted" style={{ marginTop: spacing.sm }}>
          Waiting for the client to pay.
        </AppText>
      ) : null}
    </Card>
  );
}
