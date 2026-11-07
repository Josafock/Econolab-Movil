import { useState } from 'react';
import { Linking, StyleSheet, Text } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ArrowLeft, ExternalLink, LifeBuoy, Mail, ShieldCheck } from 'lucide-react-native';
import { getPublicResources } from '@/core/public-resources';
import { useAuth } from '@/features/auth/AuthProvider';
import { Brand, Button, Card, colors, Feedback, Heading, IconBadge, Screen } from '@/ui';

export default function AboutScreen() {
  const { status } = useAuth();
  const resources = getPublicResources();
  const [error, setError] = useState('');
  async function open(url: string) {
    setError('');
    try { await Linking.openURL(url); }
    catch { setError('No pudimos abrir el enlace. Revisa tu conexión o la aplicación de correo de tu dispositivo.'); }
  }
  return <Screen bottomInset={status !== 'authenticated'}>
    <Brand />
    <Heading eyebrow="Para usar Econolab" title="Ayuda y uso de datos" subtitle={`Versión ${Constants.expoConfig?.version ?? '—'}`} />
    <Card>
      <IconBadge icon={LifeBuoy} tone="blue" />
      <Text accessibilityRole="header" style={styles.title}>Tu acceso al laboratorio</Text>
      <Text style={styles.body}>Esta aplicación es para el personal autorizado de Econolab. Usa tu cuenta de la web; si necesitas acceso o recuperar tu contraseña, comunícate con el administrador.</Text>
      <Text style={styles.body}>Necesitas internet para consultar estudios, actualizar tu perfil y revisar cortes. Si una consulta falla, revisa la conexión y vuelve a intentarlo desde la misma pantalla.</Text>
      <Text style={styles.body}>Los cortes están disponibles para administradores. Resumen los importes de los servicios registrados por fecha; no representan cobros ni efectivo recibido.</Text>
      {resources.supportEmail ? <Button title="Contactar soporte" icon={Mail} variant="secondary" onPress={() => { void open(`mailto:${resources.supportEmail}`); }} /> : null}
    </Card>
    <Card>
      <IconBadge icon={ShieldCheck} tone="green" />
      <Text accessibilityRole="header" style={styles.title}>Uso de tu información</Text>
      <Text style={styles.body}>Tu correo y contraseña se envían al servidor de Econolab para verificar el acceso. Puedes consultar y editar tu nombre y correo en Mi perfil. El rol determina qué módulos puedes abrir.</Text>
      <Text style={styles.body}>En Android y iOS guardamos la sesión en el almacenamiento seguro del dispositivo. La contraseña no se guarda. Al cerrar sesión se elimina el acceso local y se solicita su revocación al servidor.</Text>
      <Text style={styles.body}>Puedes administrar el consentimiento, las finalidades opcionales y la cancelación de tu cuenta en Mi perfil → Privacidad y mis datos. Para solicitudes sobre expedientes clínicos, contacta al laboratorio.</Text>
      {resources.privacyUrl ? <Button title="Política de privacidad" icon={ExternalLink} variant="secondary" onPress={() => { void open(resources.privacyUrl!); }} /> : null}
    </Card>
    {error ? <Feedback kind="error" message={error} /> : null}
    <Text style={styles.note}>La app permite consultar el catálogo y administrar información de trabajo. No realiza diagnósticos ni sustituye la atención de un profesional de salud.</Text>
    <Button title="Volver" icon={ArrowLeft} variant="secondary" onPress={() => { if (router.canGoBack()) router.back(); else router.replace(status === 'authenticated' ? '/' : '/login'); }} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 20 },
});
