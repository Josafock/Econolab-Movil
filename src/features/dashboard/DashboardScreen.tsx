import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, FlaskConical, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, Card, colors, Feedback, Heading, IconBadge, Screen } from '@/ui';
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
    <Heading eyebrow="Tu espacio de trabajo" title={`Hola, ${session.usuario.nombre.trim().split(/\s+/)[0]}`} subtitle="Qué bueno tenerte de vuelta." />
    {error ? <Feedback kind="error" message={error} /> : null}
    <LinearGradient colors={['#0f172a', '#450a0a', '#991b1b']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroTop}><View style={styles.heroIcon}><FlaskConical size={24} color="#fecaca" strokeWidth={1.6} /></View><View style={styles.badge}><ShieldCheck size={13} color="#fecaca" /><Text style={styles.badgeText}>{role}</Text></View></View>
      <Text style={styles.heroEyebrow}>ECONOLAB A TU ALCANCE</Text>
      <Text accessibilityRole="header" style={styles.heroTitle}>{'El laboratorio,\nen tus manos.'}</Text>
      <Text style={styles.heroDescription}>Consulta estudios, precios y parámetros desde donde estés.</Text>
      <Button title="Consultar estudios" icon={ArrowUpRight} onPress={() => router.navigate('/studies')} />
    </LinearGradient>
    <Text accessibilityRole="header" style={styles.sectionTitle}>Accesos rápidos</Text>
    <Card>
      <IconBadge icon={FlaskConical} />
      <Text accessibilityRole="header" style={styles.title}>Catálogo de estudios</Text>
      <Text style={styles.description}>Encuentra un estudio, consulta sus precios y revisa sus parámetros.</Text>
      <Button title="Explorar catálogo" icon={ArrowUpRight} variant="secondary" onPress={() => router.navigate('/studies')} />
    </Card>
    <Card>
      <IconBadge icon={UserRound} tone="blue" />
      <Text accessibilityRole="header" style={styles.title}>Mi perfil</Text>
      <Text style={styles.description}>Consulta tu información y actualiza tu contraseña.</Text>
      <Button title="Abrir mi perfil" icon={ArrowUpRight} variant="secondary" onPress={() => router.navigate('/profile')} />
    </Card>
    <Button title="Cerrar sesión" icon={LogOut} variant="secondary" onPress={() => setConfirming(true)} loading={busy} />
    <ConfirmDialog visible={confirming} title="Cerrar sesión" message="¿Quieres salir de ECONOLAB en este dispositivo?" confirmLabel="Salir" onConfirm={closeSession} onCancel={() => setConfirming(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { fontSize: 19, fontWeight: '700', color: colors.text, letterSpacing: -0.3 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 4 },
  description: { fontSize: 14, lineHeight: 22, color: colors.muted },
  hero: { borderRadius: 26, padding: 24, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  heroIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ffffff12', alignItems: 'center', justifyContent: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#ffffff10', borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fecaca' },
  heroEyebrow: { color: '#fca5a5', fontSize: 10, letterSpacing: 1.6, fontWeight: '700', marginTop: 4 },
  heroTitle: { color: '#ffffff', fontSize: 29, fontWeight: '700', lineHeight: 36, letterSpacing: -0.6 },
  heroDescription: { color: '#cbd5e1', fontSize: 14, lineHeight: 22 },
});
