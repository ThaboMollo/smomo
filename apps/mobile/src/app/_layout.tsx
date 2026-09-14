import '@/global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { usePushNotifications } from '@/lib/notifications';
import { queryClient } from '@/lib/queryClient';
import { useTheme } from '@/lib/theme';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { ModeProvider } from '@/providers/ModeProvider';
import { PendingRequestProvider } from '@/providers/PendingRequestProvider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { ready, userId } = useAuth();
  const { colors, scheme } = useTheme();
  usePushNotifications(userId);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ModeProvider>
              <PendingRequestProvider>
                <RootNavigator />
              </PendingRequestProvider>
            </ModeProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
