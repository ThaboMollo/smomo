import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
// NOTE: Map view is intentionally deferred for now — list-first experience.
// import MapView, { Marker } from 'react-native-maps';

import { CategoryIcon } from '@/components/CategoryIcon';
import { NavIcon } from '@/components/NavIcon';
import { ProviderCardView } from '@/components/ProviderCardView';
import { COUNTRIES, type CountryCode } from '@smomo/shared';

import { CATEGORIES, type BookingMode, type ServiceCategory } from '@/lib/categories';
import { CityCentreSelect } from '@/components/ManualAddressFields';
import { GEOLOCATION_ENABLED } from '@/lib/features';
import { getCurrentCoords, type Coords } from '@/lib/location';
import { radius, spacing, useTheme } from '@/lib/theme';
import { useNearbyProviders } from '@/data/discovery';
import { AppText, Button, Chip, EmptyState, Row, Screen, Segmented, Skeleton } from '@/ui';

/** Web labels the first mode "Any", not "All". */
const MODES: { value: 'all' | BookingMode; label: string }[] = [
  { value: 'all', label: 'Any' },
  { value: 'mobile', label: 'They come to me' },
  { value: 'studio', label: 'At their studio' },
];

export default function Discover() {
  const { colors } = useTheme();
  // Parked geolocation: there is no position at all. The search centre is a city name and
  // the RPC matches on it, returning no distances (migration 16).
  const [coords, setCoords] = useState<Coords | null>(null);
  const [category, setCategory] = useState<ServiceCategory | null>(null);
  const [mode, setMode] = useState<'all' | BookingMode>('all');
  // The chosen search centre, shown in the picker so it is never a silent default.
  const [centre, setCentre] = useState<{ country: CountryCode; city: string } | null>(() =>
    GEOLOCATION_ENABLED ? null : { country: 'ZA', city: COUNTRIES.ZA.cities[0].name },
  );

  useEffect(() => {
    if (!GEOLOCATION_ENABLED) return;
    getCurrentCoords().then(setCoords);
  }, []);

  const { data: providers, isLoading, isError, refetch, isRefetching } = useNearbyProviders({
    coords,
    city: GEOLOCATION_ENABLED ? null : centre?.city,
    category,
    mode: mode === 'all' ? null : mode,
  });

  const list = providers ?? [];
  const online = list.filter((p) => p.is_online).length;
  // Parked, "ready" means a chosen city, not a fix that is never coming.
  const loading = isLoading || (GEOLOCATION_ENABLED ? !coords : !centre);

  const header = (
    <>
      <View style={{ paddingTop: spacing.sm }}>
        <AppText variant="display" weight="700">
          Discover
        </AppText>
        <AppText variant="small" color="textMuted" style={{ marginTop: spacing.sm }}>
          {GEOLOCATION_ENABLED ? 'Within 50 km of you' : `Within 50 km of ${centre?.city ?? '—'}`}
        </AppText>
      </View>

      {GEOLOCATION_ENABLED ? null : (
        <View style={{ marginTop: spacing.md }}>
          <CityCentreSelect
            value={centre}
            onChange={(v) => setCentre({ country: v.country, city: v.city })}
          />
        </View>
      )}

      {/* Broadcast CTA. The web's is an ink panel, not a pink one. */}
      <Pressable
        onPress={() => router.push('/(app)/new-request')}
        accessibilityRole="button"
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.lg,
            marginTop: spacing.xl,
            padding: spacing.lg,
            borderRadius: radius.xl,
            backgroundColor: colors.primaryDeep,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <NavIcon name="plus" size={20} color={colors.onPrimary} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="heading" weight="500" style={{ color: '#FFFFFF' }}>
            Post a request
          </AppText>
          <AppText variant="small" style={{ color: colors.primaryBorder }}>
            Tell pros what you need. They send you offers.
          </AppText>
        </View>
        <NavIcon name="chevronRight" size={18} color={colors.primaryBorder} />
      </Pressable>
    </>
  );

  const filters = (
    <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // Without flexGrow: 0 the row stretches to fill the column's spare height.
        style={{ flexGrow: 0, marginHorizontal: -spacing.lg }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
      >
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            label={c.label}
            leading={<CategoryIcon category={c.value} size={20} />}
            selected={category === c.value}
            onPress={() => setCategory((prev) => (prev === c.value ? null : c.value))}
          />
        ))}
      </ScrollView>

      <Segmented value={mode} onChange={setMode} options={MODES} />
    </View>
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={loading || isError ? [] : list}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}
        onRefresh={coords ? refetch : undefined}
        refreshing={isRefetching}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.md }}>
            {header}
            {filters}
            {!loading && !isError && list.length > 0 ? (
              <Row>
                <AppText weight="500">
                  {list.length} pro{list.length === 1 ? '' : 's'} nearby
                </AppText>
                {online > 0 ? (
                  <AppText color="textMuted"> · {online} online now</AppText>
                ) : null}
              </Row>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <ProviderCardView
            provider={item}
            onPress={() => router.push(`/(app)/provider/${item.id}`)}
          />
        )}
        ListFooterComponent={
          list.length > 0 && !loading && !isError ? null : loading ? (
            <View style={{ gap: spacing.md }}>
              <AppText variant="small" color="textMuted">
                Finding pros near you…
              </AppText>
              <Skeleton height={116} />
              <Skeleton height={116} />
              <Skeleton height={116} />
            </View>
          ) : isError ? (
            <EmptyState
              fill={false}
              title="We couldn't load pros right now"
              body="Check your connection and try again."
              action={<Button title="Try again" variant="secondary" full={false} onPress={() => refetch()} />}
            />
          ) : (
            <EmptyState
              fill={false}
              title="No pros nearby for this filter"
              body="Try another service, or post a request and pros will come to you."
              action={
                <Button
                  title="Post a request"
                  full={false}
                  onPress={() => router.push('/(app)/new-request')}
                />
              }
            />
          )
        }
      />
    </Screen>
  );
}
