import { View } from 'react-native';

import { categoryEmoji, categoryLabel } from '@/lib/categories';
import { formatDistance, formatZar } from '@/lib/format';
import { spacing, useTheme } from '@/lib/theme';
import type { ProviderCard } from '@/data/discovery';
import { AppText, Avatar, Badge, Card, Row, StarRating } from '@/ui';

export function ProviderCardView({
  provider,
  onPress,
}: {
  provider: ProviderCard;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Card onPress={onPress} style={{ marginBottom: spacing.md }}>
      <Row style={{ gap: spacing.md, alignItems: 'flex-start' }}>
        <View>
          <Avatar uri={provider.avatar_url} name={provider.business_name} size={56} />
          {provider.is_online ? (
            <View
              style={{
                position: 'absolute',
                right: 0,
                bottom: 0,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: colors.online,
                borderWidth: 2,
                borderColor: colors.card,
              }}
            />
          ) : null}
        </View>

        <View style={{ flex: 1, gap: 4 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <AppText variant="heading" numberOfLines={1} style={{ flex: 1 }}>
              {provider.business_name ?? 'Provider'}
            </AppText>
            {provider.verification_status === 'verified' ? (
              <Badge label="Verified" tone="success" icon="shield-checkmark" />
            ) : null}
          </Row>

          <Row style={{ gap: 6, flexWrap: 'wrap' }}>
            {provider.categories.slice(0, 3).map((c) => (
              <AppText key={c} variant="small" color="textMuted">
                {categoryEmoji(c)} {categoryLabel(c)}
              </AppText>
            ))}
          </Row>

          <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
            <StarRating value={provider.rating} count={provider.rating_count} />
            <Row style={{ gap: spacing.md }}>
              {provider.min_price != null ? (
                <AppText variant="small" color="textMuted">
                  from {formatZar(provider.min_price)}
                </AppText>
              ) : null}
              <AppText variant="small" color="primary" weight="600">
                {formatDistance(provider.distance_km)}
              </AppText>
            </Row>
          </Row>
        </View>
      </Row>
    </Card>
  );
}
