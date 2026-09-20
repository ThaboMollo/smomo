import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { Linking, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { SOCIAL_PLATFORMS, socialUrl } from '@smomo/shared';
import { SERVICE_MODE_LABEL, categoryEmoji, categoryLabel } from '@/lib/categories';
import { formatTimeAgo, formatZar } from '@/lib/format';
import { radius, spacing, useTheme } from '@/lib/theme';
import { useProviderDetail } from '@/data/discovery';
import {
  AppText,
  Avatar,
  Badge,
  Button,
  Card,
  Divider,
  Header,
  Loader,
  Row,
  Screen,
  StarRating,
} from '@/ui';

export default function ProviderProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const { data, isLoading } = useProviderDetail(id);

  if (isLoading) return <Screen><Loader /></Screen>;
  if (!data) {
    return (
      <Screen>
        <Header title="Provider" onBack={() => safeBack()} />
        <AppText style={{ padding: spacing.lg }}>Provider not found.</AppText>
      </Screen>
    );
  }

  const { profile, practitioner, services, portfolio, reviews } = data;
  const tile = (width - spacing.lg * 2 - spacing.sm * 2) / 3;

  const onRequest = () =>
    router.push({
      pathname: '/(app)/new-request',
      params: {
        target: id,
        category: practitioner.categories[0],
        businessName: practitioner.business_name ?? profile.full_name ?? 'pro',
      },
    });

  return (
    <Screen edges={['top']}>
      <Header title={practitioner.business_name ?? 'Provider'} onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        <Row style={{ gap: spacing.md }}>
          <View>
            <Avatar uri={profile.avatar_url} name={practitioner.business_name} size={72} />
            {practitioner.is_online ? (
              <View
                style={{
                  position: 'absolute', right: 0, bottom: 0, width: 16, height: 16,
                  borderRadius: 8, backgroundColor: colors.online, borderWidth: 2, borderColor: colors.bg,
                }}
              />
            ) : null}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <AppText variant="title" weight="700" numberOfLines={1}>
              {practitioner.business_name ?? profile.full_name}
            </AppText>
            <StarRating value={practitioner.rating} count={practitioner.rating_count} size={16} />
            <Row style={{ gap: spacing.sm, marginTop: 4 }}>
              {practitioner.verification_status === 'verified' ? (
                <Badge label="Verified" tone="success" icon="shield-checkmark" />
              ) : (
                <Badge label="Unverified" tone="warning" />
              )}
              <Badge label={`${practitioner.jobs_done} jobs`} />
            </Row>
          </View>
        </Row>

        <AppText variant="small" color="textMuted" style={{ marginTop: spacing.md }}>
          {SERVICE_MODE_LABEL[practitioner.service_mode]}
          {practitioner.service_mode !== 'studio'
            ? ` · travels up to ${practitioner.travel_radius_km} km`
            : ''}
        </AppText>

        <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.sm }}>
          {practitioner.categories.map((c) => (
            <Badge key={c} label={`${categoryEmoji(c)} ${categoryLabel(c)}`} tone="primary" />
          ))}
        </Row>

        {practitioner.bio ? (
          <AppText variant="body" style={{ marginTop: spacing.md }}>
            {practitioner.bio}
          </AppText>
        ) : null}

        {/* Socials */}
        {(() => {
          const socials = SOCIAL_PLATFORMS.map((platform) => ({
            platform,
            url: socialUrl(platform, practitioner[platform.key]),
          })).filter((s) => s.url);
          return socials.length ? (
            <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginTop: spacing.md }}>
              {socials.map(({ platform, url }) => (
                <Pressable
                  key={platform.key}
                  onPress={() => Linking.openURL(url!)}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                  }}
                >
                  <AppText variant="small" color="textMuted">
                    {platform.label} ↗
                  </AppText>
                </Pressable>
              ))}
            </Row>
          ) : null;
        })()}

        {/* Portfolio */}
        {portfolio.length ? (
          <>
            <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              Portfolio
            </AppText>
            <Row style={{ flexWrap: 'wrap', gap: spacing.sm }}>
              {portfolio.map((p) => (
                <Image
                  key={p.id}
                  source={{ uri: p.image_url }}
                  style={{ width: tile, height: tile, borderRadius: radius.md, backgroundColor: colors.cardMuted }}
                  contentFit="cover"
                />
              ))}
            </Row>
          </>
        ) : null}

        {/* Services */}
        {services.length ? (
          <>
            <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              Services
            </AppText>
            <Card>
              {services.map((s, i) => (
                <View key={s.id}>
                  {i > 0 ? <Divider /> : null}
                  <Row style={{ justifyContent: 'space-between', paddingVertical: spacing.sm }}>
                    <View style={{ flex: 1 }}>
                      <AppText weight="600">{s.title}</AppText>
                      {s.description ? (
                        <AppText variant="small" color="textMuted">
                          {s.description}
                        </AppText>
                      ) : null}
                    </View>
                    {s.indicative_price_zar != null ? (
                      <AppText color="primary" weight="600">
                        from {formatZar(s.indicative_price_zar)}
                      </AppText>
                    ) : null}
                  </Row>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {/* Reviews */}
        {reviews.length ? (
          <>
            <AppText variant="heading" style={{ marginTop: spacing.xl, marginBottom: spacing.sm }}>
              Reviews
            </AppText>
            {reviews.map((r) => (
              <Card key={r.id} style={{ marginBottom: spacing.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row style={{ gap: spacing.sm }}>
                    <Avatar uri={r.reviewer?.avatar_url} name={r.reviewer?.full_name} size={32} />
                    <AppText weight="600">{r.reviewer?.full_name ?? 'Client'}</AppText>
                  </Row>
                  <StarRating value={r.rating} />
                </Row>
                {r.comment ? (
                  <AppText variant="small" color="textMuted" style={{ marginTop: spacing.sm }}>
                    {r.comment}
                  </AppText>
                ) : null}
                <AppText variant="caption" color="textFaint" style={{ marginTop: 4 }}>
                  {formatTimeAgo(r.created_at)}
                </AppText>
              </Card>
            ))}
          </>
        ) : null}
      </ScrollView>

      <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: spacing.lg }}>
        <Button title="Request a booking" icon="send" onPress={onRequest} />
      </View>
    </Screen>
  );
}
