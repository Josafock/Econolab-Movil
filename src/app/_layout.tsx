import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { Brand, Button, Feedback, Heading, Loading, Screen, colors } from '@/ui';
import ConnectionBanner from '@/ui/ConnectionBanner';
import BottomNavigation from '@/ui/BottomNavigation';

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <SafeAreaProvider><SafeAreaView style={{ flex: 1 }}><Screen>
    <Heading title="No pudimos abrir esta pantalla" subtitle="Puedes volver a intentarlo para continuar." />
    <Button title="Volver a intentar" onPress={retry} />
  </Screen></SafeAreaView></SafeAreaProvider>;
}

function AuthenticatedNavigation() {
  const { status, error, notice, retry, logout } = useAuth();
  if (status === 'loading') {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><Loading /></SafeAreaView>;
  }
  if (status === 'error') {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
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
    <View style={{ flex: 1, backgroundColor: colors.background }}><Stack screenOptions={{ headerTitle: () => <Brand compact />, headerTitleAlign: 'center', headerTintColor: colors.text, headerStyle: { backgroundColor: colors.card }, headerShadowVisible: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={status === 'anonymous'}>
        <Stack.Screen name="login" options={{ title: 'Iniciar sesión', headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={status === 'authenticated'}>
        <Stack.Screen name="index" options={{ title: 'Inicio' }} />
        <Stack.Screen name="studies/index" options={{ title: 'Estudios' }} />
        <Stack.Screen name="studies/[id]" options={{ title: 'Detalle del estudio' }} />
        <Stack.Screen name="profile" options={{ title: 'Mi perfil' }} />
      </Stack.Protected>
    </Stack><ConnectionBanner />{status === 'authenticated' ? <BottomNavigation /> : null}</View>
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
