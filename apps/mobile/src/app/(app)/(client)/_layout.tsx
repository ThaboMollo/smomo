import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { NavIcon, type NavIconName } from '@/components/NavIcon';
import { fontFamily, useTheme } from '@/lib/theme';

/** The web's nav marks: one stroke family, active state carried by colour and weight. */
function icon(name: NavIconName) {
  function TabIcon({ color, size }: { color: ColorValue; size: number; focused: boolean }) {
    return <NavIcon name={name} size={size} color={String(color)} />;
  }
  return TabIcon;
}

export default function ClientTabs() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryStrong,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: icon('discover') }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity', tabBarIcon: icon('requests') }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats', tabBarIcon: icon('chats') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('profile') }} />
    </Tabs>
  );
}
