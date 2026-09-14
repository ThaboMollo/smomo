import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
// NOTE: Map view is intentionally deferred for now — list-first experience.
// import MapView, { Marker } from 'react-native-maps';

import { ProviderCardView } from '@/components/ProviderCardView';
import { CATEGORIES, type BookingMode, type ServiceCategory } from '@/lib/categories';
import { getCurrentCoords, type Coords } from '@/lib/location';
import { spacing, useTheme } from '@/lib/theme';
import { useNearbyProviders } from '@/data/discovery';
import { AppText, Button, Card, Chip, EmptyState, Ionicons, Loader, Row, Screen, Segmented } from '@/ui';

export default function Discover() {
  const { colors } = useTheme();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [mode, setMode] = useState<'all' | BookingMode>('all');

  useEffect(() => {
    getCurrentCoords().then(setCoords);
  }, []);

  const { data: providers, isLoading, refetch, isRefetching } = useNearbyProviders({
    coords,
    category,
    mode: mode === 'all' ? null : mode,
  });

  return (
    <Screen edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <AppText variant="title" weight="700">
          Discover
        </AppText>
        <AppText variant="small" color="textMuted">
          Find beauty & body-service pros around you
        </AppText>
      </View>

      {/* Broadcast CTA — primary, inDrive-style flow */}
      <Pressable onPress={() => router.push('/(app)/new-request')} style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
        <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading" style={{ color: colors.onPrimary }}>
                Post a request
              </AppText>
              <AppText variant="small" style={{ color: colors.onPrimary, opacity: 0.9 }}>
                Tell pros what you need — they'll send you offers.
              </AppText>
            </View>
            <Ionicons name="megaphone" size={28} color={colors.onPrimary} />
          </Row>
        </Card>
      </Pressable>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.md }}
      >
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            emoji={c.emoji}
            selected={category === c.value}
            onPress={() => setCategory((prev) => (prev === c.value ? null : c.value))}
          />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'all', label: 'All' },
            { value: 'mobile', label: 'They come to me' },
            { value: 'studio', label: 'At their studio' },
          ]}
        />
      </View>

      {isLoading || !coords ? (
        <Loader label="Finding providers near you…" />
      ) : (
        <FlatList
          data={providers ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 }}
          onRefresh={refetch}
          refreshing={isRefetching}
          renderItem={({ item }) => (
            <ProviderCardView provider={item} onPress={() => router.push(`/(app)/provider/${item.id}`)} />
          )}
          ListEmptyComponent={
            <EmptyState
              emoji="🔍"
              title="No providers online nearby"
              message="Try a different category or post a request — pros will come to you."
              action={<Button title="Post a request" icon="megaphone" onPress={() => router.push('/(app)/new-request')} />}
            />
          }
        />
      )}
    </Screen>
  );
}
