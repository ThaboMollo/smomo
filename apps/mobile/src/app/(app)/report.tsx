import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { spacing, useTheme } from '@/lib/theme';
import { useCreateReport } from '@/data/misc';
import { AppText, Button, Chip, Header, Input, Ionicons, Row, Screen } from '@/ui';

const REASONS = ['No-show', 'Inappropriate behaviour', 'Payment issue', 'Poor service', 'Other'];

export default function Report() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ userId?: string; bookingId?: string }>();
  const createReport = useCreateReport();
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (!params.userId) return;
    await createReport.mutateAsync({
      reportedUserId: params.userId,
      bookingId: params.bookingId ?? null,
      reason,
      details: details.trim() || undefined,
    });
    setDone(true);
    setTimeout(() => safeBack(), 1200);
  };

  return (
    <Screen>
      <Header title="Report a problem" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {done ? (
          <View style={{ alignItems: 'center', gap: spacing.md, marginTop: spacing.xl }}>
            <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            <AppText variant="heading" center>
              Thanks — our team will review this.
            </AppText>
          </View>
        ) : (
          <>
            <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
              What went wrong?
            </AppText>
            <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.lg }}>
              {REASONS.map((r) => (
                <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(r)} />
              ))}
            </Row>
            <Input
              label="Details"
              placeholder="Tell us what happened"
              value={details}
              onChangeText={setDetails}
              multiline
              style={{ minHeight: 100, textAlignVertical: 'top' }}
            />
            <Button
              title="Submit report"
              icon="flag"
              variant="danger"
              loading={createReport.isPending}
              onPress={onSubmit}
            />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
