import { router } from 'expo-router';
import { Button, Heading, Screen } from '@/ui';
import { useAuth } from '@/features/auth/AuthProvider';

export default function NotFound() {
  const { status } = useAuth();
  return <Screen bottomInset={status !== 'authenticated'}>
    <Heading title="No encontramos esta pantalla" subtitle="El enlace puede haber cambiado. Vuelve al inicio para continuar en Econolab." />
    <Button title="Volver al inicio" onPress={() => router.replace(status === 'authenticated' ? '/' : '/login')} />
  </Screen>;
}
