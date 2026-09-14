import { Redirect } from 'expo-router';

import { useAuth } from '@/providers/AuthProvider';
import { useMode } from '@/providers/ModeProvider';

export default function AppIndex() {
  const { mode } = useMode();
  const { isPractitioner } = useAuth();

  if (mode === 'work') {
    if (!isPractitioner) return <Redirect href="/(app)/onboarding" />;
    return <Redirect href="/(app)/(work)/feed" />;
  }
  return <Redirect href="/(app)/(client)/discover" />;
}
