import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { Button, Feedback, Heading, Loading, Screen, colors } from '@/ui';

function AuthenticatedNavigation() {
  const { status, error, notice, retry, logout } = useAuth();
  if (status === 'loading') {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><Loading /></SafeAreaView>;
  }
  if (status === 'error') {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <Screen>
          <Heading title="No pudimos verificar tu sesión" subtitle="Necesitamos comprobar tu acceso antes de abrir la aplicación." />
          <Feedback kind="error" message={error ?? 'Vuelve a intentarlo.'} onRetry={retry} />
          {notice ? <Feedback message={notice} /> : null}
          <Button title="Cerrar sesión en este dispositivo" variant="secondary" onPress={() => { void logout(); }} />
        </Screen>
      </SafeAreaView>
    );
  }
  return (
    <Stack screenOptions={{ headerTitle: 'ECONOLAB', headerTintColor: colors.primaryDark, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={status === 'anonymous'}>
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión', headerTitle: 'Iniciar sesión' }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="index" options={{ title: 'Inicio' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <AuthenticatedNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
