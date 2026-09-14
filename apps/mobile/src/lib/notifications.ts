import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// expo-notifications' remote-push support was removed from Expo Go (SDK 53+),
// and importing it there throws. Only load it outside Expo Go (i.e. dev/prod builds).
const isExpoGo = Constants.appOwnership === 'expo';

async function registerToken(Notifications: typeof import('expo-notifications'), userId: string) {
  if (!Device.isDevice) return;
  try {
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return; // needs an EAS project id

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase
      .from('device_push_tokens')
      .upsert({ user_id: userId, expo_push_token: token, platform: Platform.OS }, { onConflict: 'expo_push_token' });
  } catch {
    // best-effort
  }
}

/** Registers for push + routes when a notification is tapped. No-op in Expo Go. */
export function usePushNotifications(userId: string | null) {
  const subRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (isExpoGo) return; // push unsupported in Expo Go — use a dev build

    let Notifications: typeof import('expo-notifications');
    try {
      Notifications = require('expo-notifications');
    } catch {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (userId) registerToken(Notifications, userId);

    subRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const url = response.notification.request.content.data?.url as string | undefined;
      if (url) router.push(url as never);
    });

    return () => subRef.current?.remove();
  }, [userId]);
}
