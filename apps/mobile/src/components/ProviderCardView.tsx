import { Image } from 'expo-image';
import { View } from 'react-native';

import { categoryLabel } from '@/lib/categories';
import { categoryImage } from '@/lib/catalog';
import { formatWhereAway, joinMeta, formatZar } from '@/lib/format';
import { radius, spacing, useTheme } from '@/lib/theme';
import type { ProviderCard } from '@/data/discovery';
import { AppText, Card, Row, StarRating } from '@/ui';

/**
 * Mirrors the web's `DiscoverProviderCard`: a square editorial photo beside the name,
 * crafts and distance, with the rating and starting price on the baseline. The photo
 * falls back to the craft's editorial image, so a card is never a blank tile.
 */
export function ProviderCardView({
  provider,
  onPress,
}: {
  provider: ProviderCard;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const photo = provider.avatar_url ?? (provider.categories[0] ? categoryImage(provider.categories[0]) : null);
  const crafts = provider.categories.map((c) => categoryLabel(c)).join(' · ');

  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md, padding: spacing.sm }}>
      <Row style={{ gap: spacing.md, alignItems: 'stretch' }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: radius.lg,
            overflow: 'hidden',
            backgroundColor: colors.primarySoft,
          }}
        >
          {photo ? (
            <Image
              source={{ uri: photo }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={150}
            />
          ) : null}
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 4, paddingRight: spacing.xs }}>
          <Row style={{ gap: spacing.sm }}>
            <AppText weight="500" numberOfLines={1} style={{ flexShrink: 1 }}>
              {provider.business_name ?? 'Provider'}
            </AppText>
            {provider.is_online ? (
              <View
                accessibilityLabel="Online now"
                style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.online }}
              />
            ) : null}
            {provider.verification_status === 'verified' ? (
              <View
                style={{
                  marginLeft: 'auto',
                  borderRadius: radius.pill,
                  backgroundColor: colors.primarySoft,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <AppText variant="caption" color="primaryStrong">
                  Verified
                </AppText>
              </View>
            ) : null}
          </Row>

          <AppText variant="small" color="textMuted" numberOfLines={1}>
            {/* Null distance means the match came from the city, not a point (migration 16):
                show the crafts alone rather than a distance we'd be inventing. */}
            {joinMeta(crafts, formatWhereAway(provider.distance_km))}
          </AppText>

          <Row style={{ justifyContent: 'space-between' }}>
            <StarRating value={provider.rating} count={provider.rating_count} />
            {provider.min_price != null ? (
              <AppText variant="small" color="primaryStrong" weight="500">
                from {formatZar(provider.min_price)}
              </AppText>
            ) : null}
          </Row>
        </View>
      </Row>
    </Card>
  );
}
