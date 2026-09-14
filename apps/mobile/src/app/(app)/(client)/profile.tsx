import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { spacing, useTheme } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { useMode } from '@/providers/ModeProvider';
import { AppText, Avatar, Button, Card, Ionicons, Row, Screen, StarRating } from '@/ui';

export default function ClientProfile() {
  const { colors } = useTheme();
  const { profile, isAnonymous, isPractitioner, isAdmin, signOut } = useAuth();
  const { setMode, resetChoice } = useMode();

  const onSignOut = async () => {
    await signOut();
    resetChoice();
    router.replace('/(auth)/welcome');
  };

  const goWork = () => {
    if (isPractitioner) {
      setMode('work');
      router.replace('/(app)');
    } else {
      router.push('/(app)/onboarding');
    }
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {isAnonymous ? (
          <View style={{ alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg }}>
            <Avatar name="?" size={72} />
            <AppText variant="title" weight="700">
              You're browsing as a guest
            </AppText>
            <AppText variant="small" color="textMuted" center>
              Create an account to post requests, book pros and track your bookings.
            </AppText>
          </View>
        ) : (
          <View style={{ alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg }}>
            <Avatar uri={profile?.avatar_url} name={profile?.full_name} size={88} />
            <AppText variant="title" weight="700">
              {profile?.full_name}
            </AppText>
            <AppText variant="small" color="textMuted">
              {profile?.phone}
            </AppText>
            {profile?.client_rating != null ? (
              <StarRating value={profile.client_rating} count={profile.client_rating_count} size={16} />
            ) : null}
          </View>
        )}

        {isAnonymous ? (
          <>
            <Button title="Create an account" icon="person-add" onPress={() => router.push('/(auth)/welcome')} />
            <Button title="Log in" variant="ghost" onPress={() => router.push('/(auth)/login')} style={{ marginTop: spacing.sm }} />
          </>
        ) : (
          <>
            <Card
              onPress={goWork}
              style={{ marginBottom: spacing.md, backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="heading" color="primary">
                    {isPractitioner ? 'Switch to Work mode' : 'Become a provider'}
                  </AppText>
                  <AppText variant="small" color="textMuted">
                    {isPractitioner ? 'Go online and receive client requests.' : 'Offer your services and earn on Smomo.'}
                  </AppText>
                </View>
                <Ionicons name="briefcase" size={26} color={colors.primary} />
              </Row>
            </Card>

            {isAdmin ? (
              <Card>
                <Row style={{ justifyContent: 'space-between', paddingVertical: spacing.sm }} onTouchEnd={() => router.push('/(app)/admin')}>
                  <Row style={{ gap: spacing.md }}>
                    <Ionicons name="shield-checkmark-outline" size={22} color={colors.text} />
                    <AppText>Admin dashboard</AppText>
                  </Row>
                  <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
                </Row>
              </Card>
            ) : null}

            <Button title="Sign out" variant="ghost" onPress={onSignOut} style={{ marginTop: spacing.xl }} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
