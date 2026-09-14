import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native';

import { COUNTRIES } from '@/lib/countries';
import { fontSize, radius, spacing, useTheme } from '@/lib/theme';
import { AppText, Header, Ionicons, Row } from '@/ui';

export function CountryPicker({
  label = 'Country of origin',
  value,
  onChange,
  error,
}: {
  label?: string;
  value: string | null;
  onChange: (country: string) => void;
  error?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  return (
    <View style={{ gap: 6, marginBottom: spacing.md }}>
      <AppText variant="small" color="textMuted" weight="600">
        {label}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          backgroundColor: colors.card,
        }}
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText style={{ color: value ? colors.text : colors.textFaint }}>
            {value ?? 'Select your country'}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.textFaint} />
        </Row>
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Header title="Select country" onBack={() => setOpen(false)} />
          <View style={{ padding: spacing.lg }}>
            <TextInput
              placeholder="Search countries…"
              placeholderTextColor={colors.textFaint}
              value={query}
              onChangeText={setQuery}
              autoFocus
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: 12,
                fontSize: fontSize.md,
                color: colors.text,
                backgroundColor: colors.card,
              }}
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(c) => c}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item);
                  setQuery('');
                  setOpen(false);
                }}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <AppText>{item}</AppText>
                  {value === item ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                </Row>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}
