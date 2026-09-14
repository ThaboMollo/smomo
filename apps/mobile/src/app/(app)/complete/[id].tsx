import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { capturePhoto, pickFromLibrary } from '@/lib/pickImage';
import { notifyUsers } from '@/lib/push';
import { radius, spacing, useTheme } from '@/lib/theme';
import { uploadImage, type PickedImage } from '@/lib/upload';
import { useBooking, useCompleteBooking } from '@/data/bookings';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Button, Header, Input, Ionicons, Loader, Row, Screen, StarRating } from '@/ui';

export default function CompleteBooking() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { data, isLoading } = useBooking(id);
  const complete = useCompleteBooking();

  const [image, setImage] = useState<PickedImage | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  if (isLoading) return <Screen><Loader /></Screen>;
  if (!data) return <Screen><Header title="Complete" onBack={() => safeBack()} /></Screen>;

  const { booking } = data;
  const consent = booking.client_consented_to_portfolio;

  const onCapture = async (fromCamera: boolean) => {
    const img = fromCamera ? await capturePhoto() : await pickFromLibrary(false);
    if (img) {
      setImage(img);
      setPreview(`data:${img.mimeType ?? 'image/jpeg'};base64,${img.base64}`);
    }
  };

  const onSubmit = async () => {
    if (!image) return setError('A proof-of-work photo is required to complete a job');
    setError(undefined);
    setBusy(true);
    try {
      // Public portfolio bucket if the client consented, else private proof bucket.
      const bucket = consent ? 'portfolio' : 'proof-private';
      const url = await uploadImage(bucket, userId!, image);
      await complete.mutateAsync({
        bookingId: booking.id,
        clientId: booking.client_id,
        rating,
        comment: comment.trim() || undefined,
        proofImageUrl: url,
      });
      notifyUsers(
        [booking.client_id],
        'Your booking is complete 💜',
        'Tap to leave a review for your provider.',
        { url: `/(app)/booking/${booking.id}` },
      );
      router.replace(`/(app)/booking/${booking.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Could not complete booking');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Complete job" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <AppText variant="heading">Proof of work</AppText>
        <AppText variant="small" color="textMuted" style={{ marginBottom: spacing.md }}>
          Capture the finished result. {consent
            ? 'The client agreed this can appear in your portfolio.'
            : 'The client did not consent to public use — this stays private proof only.'}
        </AppText>

        {preview ? (
          <Image
            source={{ uri: preview }}
            style={{ width: '100%', height: 220, borderRadius: radius.lg, marginBottom: spacing.md }}
            contentFit="cover"
          />
        ) : (
          <Pressable
            onPress={() => onCapture(true)}
            style={{
              height: 180,
              borderRadius: radius.lg,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
              gap: spacing.sm,
            }}
          >
            <Ionicons name="camera" size={40} color={colors.textFaint} />
            <AppText color="textMuted">Tap to take a photo</AppText>
          </Pressable>
        )}
        <Row style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
          <Button title="Camera" icon="camera" variant="secondary" full={false} style={{ flex: 1 }} onPress={() => onCapture(true)} />
          <Button title="Gallery" icon="images" variant="secondary" full={false} style={{ flex: 1 }} onPress={() => onCapture(false)} />
        </Row>

        <AppText variant="heading">Rate this client</AppText>
        <AppText variant="small" color="textMuted" style={{ marginBottom: spacing.sm }}>
          Only other providers see this — it helps everyone stay accountable.
        </AppText>
        <View style={{ marginBottom: spacing.md }}>
          <StarRating value={rating} size={34} onChange={setRating} />
        </View>
        <Input
          label="Comment (optional)"
          placeholder="e.g. Lovely to work with, on time"
          value={comment}
          onChangeText={setComment}
          multiline
          style={{ minHeight: 70, textAlignVertical: 'top' }}
        />

        {error ? (
          <AppText variant="small" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}
        <Button title="Complete booking" icon="checkmark-done" loading={busy} onPress={onSubmit} />
      </ScrollView>
    </Screen>
  );
}
