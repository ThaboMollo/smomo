import { Stack } from 'expo-router';

export default function AppLayout() {
  // No auth wall: everyone has at least an anonymous session (see AuthProvider).
  // Registration is enforced at the point of action (publish / save profile).
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(client)" />
      <Stack.Screen name="(work)" />
      <Stack.Screen name="onboarding" options={{ presentation: 'modal' }} />
      <Stack.Screen name="new-request" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
