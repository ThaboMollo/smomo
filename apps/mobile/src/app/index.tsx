import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';
import { useMode } from '@/providers/ModeProvider';

export default function Index() {
  const { isRegistered } = useAuth();
  const { hasChosen, hydrated } = useMode();

  if (!hydrated) return null;

  // Registered users, or anyone who has already picked a role, go straight in.
  if (isRegistered || hasChosen) return <Redirect href="/(app)" />;
  // First-time visitors choose a role before browsing.
  return <Redirect href="/(auth)/welcome" />;
}
