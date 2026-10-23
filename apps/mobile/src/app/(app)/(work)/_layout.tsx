import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { fontFamily, useTheme } from '@/lib/theme';
import { Ionicons } from '@/ui';

/** Outline when idle, filled when active — matching the client tabs and the web's nav. */
function icon(name: keyof typeof Ionicons.glyphMap, active: keyof typeof Ionicons.glyphMap) {
  function TabIcon({
    color,
    size,
    focused,
  }: {
    color: ColorValue;
    size: number;
    focused: boolean;
  }) {
    return <Ionicons name={focused ? active : name} size={size} color={color} />;
  }
  return TabIcon;
}

export default function WorkTabs() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{ title: 'Requests', tabBarIcon: icon('flash-outline', 'flash') }}
      />
      <Tabs.Screen
        name="schedule"
        options={{ title: 'Schedule', tabBarIcon: icon('calendar-outline', 'calendar') }}
      />
      <Tabs.Screen
        name="chats"
        options={{ title: 'Chats', tabBarIcon: icon('chatbubbles-outline', 'chatbubbles') }}
      />
      <Tabs.Screen
        name="studio"
        options={{ title: 'Studio', tabBarIcon: icon('storefront-outline', 'storefront') }}
      />
    </Tabs>
  );
}
