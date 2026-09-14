import { router } from 'expo-router';
import { View } from 'react-native';

import { spacing, useTheme } from '@/lib/theme';
import { useMode } from '@/providers/ModeProvider';
import { AppText, Card, Ionicons, Row, Screen } from '@/ui';

export default function Welcome() {
  const { colors } = useTheme();
  const { setMode } = useMode();

  const choose = (mode: 'client' | 'work') => {
    setMode(mode);
    router.replace('/(app)');
  };

  return (
    <Screen padded>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AppText style={{ fontSize: 44 }}>💅✨</AppText>
        <AppText variant="display" weight="700" style={{ marginTop: spacing.sm }}>
          Welcome to Smomo
        </AppText>
        <AppText variant="body" color="textMuted" style={{ marginBottom: spacing.xl }}>
          Beauty, hair, nails, make-up & ink — what brings you here?
        </AppText>

        <Card
          onPress={() => choose('client')}
          style={{ marginBottom: spacing.md, borderColor: colors.primary }}
        >
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading" color="primary">
                I need a service
              </AppText>
              <AppText variant="small" color="textMuted">
                Find pros near you and post a request.
              </AppText>
            </View>
            <Ionicons name="sparkles" size={28} color={colors.primary} />
          </Row>
        </Card>

        <Card onPress={() => choose('work')}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="heading">I offer services</AppText>
              <AppText variant="small" color="textMuted">
                Set up your profile and get client requests.
              </AppText>
            </View>
            <Ionicons name="briefcase" size={28} color={colors.text} />
          </Row>
        </Card>

        <AppText
          variant="small"
          color="primary"
          center
          style={{ marginTop: spacing.xl }}
          onPress={() => router.push('/(auth)/login')}
        >
          Already have an account? Log in
        </AppText>
      </View>
    </Screen>
  );
}
