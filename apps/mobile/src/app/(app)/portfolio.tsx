import { Image } from 'expo-image';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { pickFromLibrary } from '@/lib/pickImage';
import { radius, spacing, useTheme } from '@/lib/theme';
import { uploadImage } from '@/lib/upload';
import { useAddPortfolioItem, useDeletePortfolioItem, usePortfolio } from '@/data/practitioner';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Badge, Button, Header, Ionicons, Loader, Row, Screen } from '@/ui';

export default function Portfolio() {
  const { userId } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { data: items, isLoading } = usePortfolio(userId ?? undefined);
  const addItem = useAddPortfolioItem();
  const deleteItem = useDeletePortfolioItem();
  const [uploading, setUploading] = useState(false);

  const tile = (width - spacing.lg * 2 - spacing.sm) / 2;

  const onAdd = async () => {
    const img = await pickFromLibrary(false);
    if (!img || !userId) return;
    setUploading(true);
    try {
      const url = await uploadImage('portfolio', userId, img);
      await addItem.mutateAsync({ imageUrl: url });
    } catch {
      Alert.alert('Upload failed', 'Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Screen>
      <Header title="Portfolio" onBack={() => safeBack()} />
      {isLoading ? (
        <Loader />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Button
            title={uploading ? 'Uploading…' : 'Add photo'}
            icon="add"
            loading={uploading}
            onPress={onAdd}
            style={{ marginBottom: spacing.lg }}
          />
          <Row style={{ flexWrap: 'wrap', gap: spacing.sm }}>
            {(items ?? []).map((p) => (
              <View key={p.id} style={{ width: tile }}>
                <Image
                  source={{ uri: p.image_url }}
                  style={{ width: tile, height: tile, borderRadius: radius.md, backgroundColor: colors.cardMuted }}
                  contentFit="cover"
                />
                <Pressable
                  onPress={() =>
                    Alert.alert('Delete photo', 'Remove this from your portfolio?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteItem.mutate(p.id) },
                    ])
                  }
                  style={{ position: 'absolute', top: 6, right: 6, backgroundColor: colors.overlay, borderRadius: 999, padding: 4 }}
                >
                  <Ionicons name="trash" size={16} color="#fff" />
                </Pressable>
                {p.source === 'proof' ? (
                  <View style={{ position: 'absolute', bottom: 6, left: 6 }}>
                    <Badge label="From job" tone="primary" />
                  </View>
                ) : null}
                {!p.is_public ? (
                  <View style={{ position: 'absolute', bottom: 6, right: 6 }}>
                    <Badge label="Private" tone="warning" />
                  </View>
                ) : null}
              </View>
            ))}
          </Row>
          {!items?.length ? (
            <AppText variant="small" color="textFaint" center style={{ marginTop: spacing.xl }}>
              No portfolio photos yet. Add some, or they'll be added automatically when you complete jobs.
            </AppText>
          ) : null}
        </ScrollView>
      )}
    </Screen>
  );
}
