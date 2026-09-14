import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { spacing } from '@/lib/theme';
import { useBooking, useSubmitClientReview } from '@/data/bookings';
import { AppText, Avatar, Button, Header, Input, Loader, Screen, StarRating } from '@/ui';

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useBooking(id);
  const submit = useSubmitClientReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();

  if (isLoading) return <Screen><Loader /></Screen>;
  if (!data) return <Screen><Header title="Review" onBack={() => safeBack()} /></Screen>;

  const provider = data.booking.practitioner;

  const onSubmit = async () => {
    try {
      await submit.mutateAsync({
        bookingId: data.booking.id,
        practitionerId: data.booking.practitioner_id,
        rating,
        comment: comment.trim() || undefined,
      });
      router.replace(`/(app)/booking/${data.booking.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Could not submit review');
    }
  };

  return (
    <Screen>
      <Header title="Leave a review" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          <Avatar uri={provider?.avatar_url} name={provider?.full_name} size={72} />
          <AppText variant="heading">{provider?.full_name ?? 'Your provider'}</AppText>
          <AppText variant="small" color="textMuted">How was your experience?</AppText>
        </View>

        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <StarRating value={rating} size={40} onChange={setRating} />
        </View>

        <Input
          label="Comment (optional)"
          placeholder="Tell others about your experience"
          value={comment}
          onChangeText={setComment}
          multiline
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        {error ? (
          <AppText variant="small" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}
        <Button title="Submit review" icon="star" loading={submit.isPending} onPress={onSubmit} />
      </ScrollView>
    </Screen>
  );
}
