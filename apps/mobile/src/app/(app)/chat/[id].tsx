import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, View } from 'react-native';

import { spacing, useTheme } from '@/lib/theme';
import { useBooking } from '@/data/bookings';
import { useMessages, useSendMessage } from '@/data/chat';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Header, IconButton, Input, Loader, Screen } from '@/ui';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { userId } = useAuth();
  const { data: messages, isLoading } = useMessages(id);
  const { data: booking } = useBooking(id);
  const sendMessage = useSendMessage(id!);
  const [text, setText] = useState('');

  const inverted = useMemo(() => [...(messages ?? [])].reverse(), [messages]);
  const isClient = booking?.booking.client_id === userId;
  const other = isClient ? booking?.booking.practitioner : booking?.booking.client;

  const onSend = () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    sendMessage.mutate(body);
  };

  return (
    <Screen edges={['top']}>
      <Header title={other?.full_name ?? 'Chat'} onBack={() => safeBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {isLoading ? (
          <Loader />
        ) : (
          <FlatList
            data={inverted}
            inverted
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}
            renderItem={({ item }) => {
              const mine = item.sender_id === userId;
              return (
                <View
                  style={{
                    alignSelf: mine ? 'flex-end' : 'flex-start',
                    backgroundColor: mine ? colors.primary : colors.card,
                    borderColor: colors.border,
                    borderWidth: mine ? 0 : 1,
                    borderRadius: 16,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    maxWidth: '80%',
                  }}
                >
                  <AppText style={{ color: mine ? colors.onPrimary : colors.text }}>
                    {item.body}
                  </AppText>
                </View>
              );
            }}
            ListEmptyComponent={
              <AppText variant="small" color="textFaint" center style={{ marginTop: spacing.xl }}>
                Say hi 👋 — coordinate the details of your booking here.
              </AppText>
            }
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            padding: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Message…"
              value={text}
              onChangeText={setText}
              style={{ marginBottom: 0 }}
              onSubmitEditing={onSend}
              returnKeyType="send"
            />
          </View>
          <IconButton name="send" color={colors.primary} onPress={onSend} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
