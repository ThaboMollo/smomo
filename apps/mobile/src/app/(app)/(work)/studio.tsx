import { router } from 'expo-router';
import { ScrollView, Switch, View } from 'react-native';

import { spacing, useTheme } from '@/lib/theme';
import { useToggleOnline } from '@/data/practitioner';
import { useAuth } from '@/providers/AuthProvider';
import { useMode } from '@/providers/ModeProvider';
import { AppText, Avatar, Badge, Button, Card, Divider, Ionicons, Row, Screen, StarRating } from '@/ui';

export default function Studio() {
  const { colors } = useTheme();
  const { userId, profile, practitioner, subscription, signOut } = useAuth();
  const toggleOnline = useToggleOnline();
  const { setMode, resetChoice } = useMode();

  const onSignOut = async () => {
    await signOut();
    resetChoice();
    router.replace('/(auth)/welcome');
  };

  const subActive = subscription?.status === 'trialing' || subscription?.status === 'active';

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md }}>
          <Avatar uri={profile?.avatar_url} name={practitioner?.business_name} size={88} />
          <AppText variant="title" weight="700">
            {practitioner?.business_name ?? profile?.full_name}
          </AppText>
          <StarRating value={practitioner?.rating ?? null} count={practitioner?.rating_count ?? 0} size={16} />
          <Row style={{ gap: spacing.sm }}>
            {practitioner?.verification_status === 'verified' ? (
              <Badge label="Verified" tone="success" icon="shield-checkmark" />
            ) : (
              <Badge label={practitioner?.verification_status ?? 'unverified'} tone="warning" />
            )}
            <Badge label={`${practitioner?.jobs_done ?? 0} jobs`} />
            <Badge label={subscription?.status ?? 'no plan'} tone={subActive ? 'primary' : 'danger'} />
          </Row>
        </View>

        <Card style={{ marginBottom: spacing.md, backgroundColor: practitioner?.is_online ? colors.successSoft : colors.card }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText weight="600">{practitioner?.is_online ? "You're online" : "You're offline"}</AppText>
              <AppText variant="small" color="textMuted">
                Toggle your availability for new requests.
              </AppText>
            </View>
            <Switch
              value={!!practitioner?.is_online}
              disabled={!subActive || toggleOnline.isPending}
              onValueChange={(v) => toggleOnline.mutate(v)}
              trackColor={{ true: colors.online }}
            />
          </Row>
        </Card>

        <Card>
          <MenuRow icon="cut-outline" label="Manage services" onPress={() => router.push('/(app)/services')} />
          <Divider />
          <MenuRow icon="images-outline" label="Manage portfolio" onPress={() => router.push('/(app)/portfolio')} />
          <Divider />
          <MenuRow icon="create-outline" label="Edit business details" onPress={() => router.push('/(app)/edit-studio')} />
          <Divider />
          <MenuRow
            icon="eye-outline"
            label="View my public profile"
            onPress={() => userId && router.push(`/(app)/provider/${userId}`)}
          />
        </Card>

        <Button
          title="Switch to booking mode"
          icon="person"
          variant="secondary"
          style={{ marginTop: spacing.lg }}
          onPress={() => {
            setMode('client');
            router.replace('/(app)');
          }}
        />
        <Button title="Sign out" variant="ghost" onPress={onSignOut} style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </Screen>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: spacing.sm }} onTouchEnd={onPress}>
      <Row style={{ gap: spacing.md }}>
        <Ionicons name={icon} size={22} color={colors.text} />
        <AppText>{label}</AppText>
      </Row>
      <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
    </Row>
  );
}
