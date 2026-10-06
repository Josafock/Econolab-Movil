import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { Brand, Button, Card, colors, Feedback, Heading, Screen } from '@/ui';
import { errorMessage } from '@/core/errors';
import ConfirmDialog from '@/ui/ConfirmDialog';

export default function DashboardScreen() {
  const { session, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  if (!session) return null;
  const role = session.usuario.rol === 'admin' ? 'Administrador' : 'Recepcionista';

  const closeSession = () => {
    setConfirming(false); setBusy(true);
    void logout().catch(e => setError(errorMessage(e))).finally(() => setBusy(false));
  };

  return <Screen>
    <Brand />
    <Heading title={`Hola, ${session.usuario.nombre.split(' ')[0]}`} subtitle="Bienvenido a tu espacio de trabajo." />
    <View style={styles.badge}><Text style={styles.badgeText}>{role}</Text></View>
    {error ? <Feedback kind="error" message={error} /> : null}
    <Card>
      <Text accessibilityRole="header" style={styles.title}>Catálogo de estudios</Text>
      <Text style={styles.description}>Encuentra un estudio, consulta sus precios y revisa sus parámetros.</Text>
      <Button title="Consultar estudios" onPress={() => router.push('/studies')} />
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.title}>Mi perfil</Text>
      <Text style={styles.description}>Consulta tu información y actualiza tu contraseña.</Text>
      <Button title="Abrir mi perfil" variant="secondary" onPress={() => router.push('/profile')} />
    </Card>
    <Button title="Cerrar sesión" variant="danger" onPress={() => setConfirming(true)} loading={busy} />
    <ConfirmDialog visible={confirming} title="Cerrar sesión" message="¿Quieres salir de ECONOLAB en este dispositivo?" confirmLabel="Salir" onConfirm={closeSession} onCancel={() => setConfirming(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { fontSize: 21, fontWeight: '700', color: colors.text },
  description: { fontSize: 16, lineHeight: 24, color: colors.muted },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fef2f2', borderRadius: 20 },
  badgeText: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
