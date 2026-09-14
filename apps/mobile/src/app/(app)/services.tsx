import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { CATEGORIES, categoryLabel, type ServiceCategory } from '@/lib/categories';
import { formatZar } from '@/lib/format';
import { spacing, useTheme } from '@/lib/theme';
import { useDeleteService, useSaveService, useServices } from '@/data/practitioner';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Button, Card, Chip, Header, IconButton, Input, Row, Screen } from '@/ui';

export default function Services() {
  const { userId } = useAuth();
  const { colors } = useTheme();
  const { data: services } = useServices(userId ?? undefined);
  const saveService = useSaveService();
  const deleteService = useDeleteService();

  const [category, setCategory] = useState<ServiceCategory>('hairdresser');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState<string>();

  const onAdd = async () => {
    if (title.trim().length < 2) return setError('Enter a service name');
    setError(undefined);
    await saveService.mutateAsync({
      category,
      title: title.trim(),
      indicativePrice: price ? Number(price) : null,
      durationMinutes: duration ? Number(duration) : null,
    });
    setTitle('');
    setPrice('');
    setDuration('');
  };

  return (
    <Screen>
      <Header title="Manage services" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card style={{ marginBottom: spacing.lg }}>
          <AppText variant="heading" style={{ marginBottom: spacing.sm }}>
            Add a service
          </AppText>
          <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.md }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.value} label={c.label} emoji={c.emoji} selected={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </Row>
          <Input label="Service name" placeholder="e.g. Gel manicure" value={title} onChangeText={setTitle} error={error} />
          <Row style={{ gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input label="From price (R)" placeholder="250" keyboardType="numeric" value={price} onChangeText={setPrice} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Duration (min)" placeholder="60" keyboardType="numeric" value={duration} onChangeText={setDuration} />
            </View>
          </Row>
          <Button title="Add service" icon="add" loading={saveService.isPending} onPress={onAdd} />
        </Card>

        <AppText variant="heading" style={{ marginBottom: spacing.sm }}>
          Your services
        </AppText>
        {(services ?? []).map((s) => (
          <Card key={s.id} style={{ marginBottom: spacing.sm }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <AppText weight="600">{s.title}</AppText>
                <AppText variant="small" color="textMuted">
                  {categoryLabel(s.category)}
                  {s.indicative_price_zar != null ? ` · from ${formatZar(s.indicative_price_zar)}` : ''}
                  {s.duration_minutes ? ` · ${s.duration_minutes} min` : ''}
                </AppText>
              </View>
              <IconButton
                name="trash-outline"
                color={colors.danger}
                onPress={() =>
                  Alert.alert('Delete service', s.title, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteService.mutate(s.id) },
                  ])
                }
              />
            </Row>
          </Card>
        ))}
        {!services?.length ? (
          <AppText variant="small" color="textFaint">
            No services yet — add your first above.
          </AppText>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
