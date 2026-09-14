import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { categoryEmoji, categoryLabel, type ServiceCategory } from '@/lib/categories';
import { formatBudget, formatZar } from '@/lib/format';
import { notifyUsers } from '@/lib/push';
import { spacing } from '@/lib/theme';
import { useMakeOffer } from '@/data/requests';
import { AppText, Button, Card, Header, Input, Screen } from '@/ui';

export default function MakeOffer() {
  const params = useLocalSearchParams<{
    id: string;
    category?: ServiceCategory;
    budgetMin?: string;
    budgetMax?: string;
    description?: string;
    clientId?: string;
  }>();
  const makeOffer = useMakeOffer();
  const budgetLabel = formatBudget(
    params.budgetMin ? Number(params.budgetMin) : null,
    params.budgetMax ? Number(params.budgetMax) : null,
  );
  const [price, setPrice] = useState(params.budgetMax ?? params.budgetMin ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string>();

  const onSubmit = async () => {
    const p = Number(price);
    if (!p || p <= 0) return setError('Enter your price');
    setError(undefined);
    try {
      await makeOffer.mutateAsync({ requestId: params.id!, price: p, message: message.trim() || undefined });
      notifyUsers(
        [params.clientId],
        'New offer received',
        `A provider offered ${formatZar(p)} for your request.`,
        { url: `/(app)/request/${params.id}` },
      );
      safeBack();
    } catch (e: any) {
      setError(e.message ?? 'Could not send offer');
    }
  };

  return (
    <Screen>
      <Header title="Make an offer" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {params.category ? (
          <Card style={{ marginBottom: spacing.lg }}>
            <AppText variant="heading">
              {categoryEmoji(params.category)} {categoryLabel(params.category)}
            </AppText>
            {params.description ? (
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                {params.description}
              </AppText>
            ) : null}
            {budgetLabel ? (
              <AppText variant="small" color="textMuted" style={{ marginTop: 4 }}>
                Client's budget: {budgetLabel}
              </AppText>
            ) : null}
          </Card>
        ) : null}

        <Input
          label="Your price (Rand)"
          placeholder="e.g. 350"
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
          error={error}
          hint="Accept the client's budget or counter with your own."
        />
        <Input
          label="Message (optional)"
          placeholder="e.g. I can do this today at 3pm, includes nail art"
          value={message}
          onChangeText={setMessage}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <Button title="Send offer" icon="send" loading={makeOffer.isPending} onPress={onSubmit} />
      </ScrollView>
    </Screen>
  );
}
