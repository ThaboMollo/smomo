import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';

import { spacing } from '@/lib/theme';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Button, Header, Input, Screen } from '@/ui';

export default function Login() {
  const { loginWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: err } = await loginWithPassword(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.replace('/(app)');
  };

  return (
    <Screen>
      <Header title="Log in" onBack={() => safeBack('/(auth)/welcome')} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, padding: spacing.lg, justifyContent: 'center' }}
      >
        <AppText variant="title" weight="700" style={{ marginBottom: spacing.lg }}>
          Welcome back
        </AppText>
        <Input
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          label="Password"
          placeholder="Your password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          error={error}
          onSubmitEditing={onLogin}
          returnKeyType="go"
        />
        <Button title="Log in" onPress={onLogin} loading={loading} />
        <AppText
          variant="small"
          color="primary"
          center
          style={{ marginTop: spacing.lg }}
          onPress={() => router.replace('/(auth)/welcome')}
        >
          New here? Choose a role to get started
        </AppText>
      </KeyboardAvoidingView>
    </Screen>
  );
}
