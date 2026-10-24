import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Linking, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Check, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { Button, Card, colors, Feedback, Field, Heading, Loading, Screen } from '@/ui';
import PasswordField from '@/ui/PasswordField';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { createPrivacyViewModel } from './PrivacyViewModel';

export default function PrivacyScreen({ onAccepted }: { onAccepted?: () => void }) {
  const { session, logout } = useAuth();
  const id = session?.usuario.id;
  const vm = useMemo(() => createPrivacyViewModel(), [id]); // eslint-disable-line react-hooks/exhaustive-deps
  const state = useSyncExternalStore(vm.subscribe, vm.getSnapshot, vm.getSnapshot);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => { void vm.load(); return () => vm.dispose(); }, [vm]);
  useEffect(() => { if (state.deleted) void logout(); }, [state.deleted, logout]);
  useEffect(() => {
    if (state.notice && state.preferences?.acceptedAt && state.preferences.noticeVersion === state.notice.version) onAccepted?.();
  }, [state.notice, state.preferences, onAccepted]);
  if (!session) return null;
  if (!state.notice) return <Screen><Heading title="Privacidad y mis datos" />{state.busy || !state.error ? <Loading /> : <Feedback kind="error" message={state.error} onRetry={() => { void vm.load(); }} />}</Screen>;
  const notice = state.notice;
  const needsConsent = state.preferences?.noticeVersion !== notice.version || !state.preferences?.acceptedAt;
  return <Screen>
    <Heading eyebrow="Tú decides" title="Privacidad y mis datos" subtitle="Conoce cómo usamos tu cuenta y administra tus decisiones." />
    <Card>
      <ShieldCheck color={colors.primary} size={26} />
      <Text accessibilityRole="header" style={styles.title}>{notice.title}</Text>
      <Text style={styles.body}>Versión {notice.version} · Responsable: {notice.controller ?? 'Por confirmar'}</Text>
      {notice.purposes.map(text => <Text key={text} style={styles.body}>• {text}</Text>)}
      <Text style={styles.body}>Datos de la cuenta: {notice.accountData.join(', ')}.</Text>
      <Text style={styles.body}>{notice.retention}</Text>
      <Text style={styles.body}>{notice.optionalPurposes}</Text>
      {notice.supportEmail ? <Text accessibilityRole="link" onPress={() => { void Linking.openURL(`mailto:${notice.supportEmail}`).catch(() => {}); }} style={styles.link}>Contacto: {notice.supportEmail}</Text> : null}
      {needsConsent ? <Pressable accessibilityRole="checkbox" accessibilityLabel="He leído y acepto el aviso de privacidad de mi cuenta" accessibilityState={{ checked: state.accepted, disabled: state.busy || !notice.ready }} disabled={state.busy || !notice.ready} onPress={() => vm.setAccepted(!state.accepted)} style={styles.checkRow}>
        <View style={[styles.checkbox, state.accepted && styles.checked]}>{state.accepted ? <Check size={18} color="white" /> : null}</View>
        <Text style={styles.checkLabel}>He leído y acepto el aviso de privacidad de mi cuenta.</Text>
      </Pressable> : <Text style={styles.body}>Aviso aceptado el {new Date(state.preferences!.acceptedAt!).toLocaleDateString('es-MX')}.</Text>}
      {!notice.ready ? <Feedback message="El responsable debe completar los datos del aviso antes de registrar tu consentimiento." /> : null}
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.title}>Finalidades opcionales</Text>
      <Text style={styles.body}>Puedes mantenerlas desactivadas. Cambiar tu decisión no cierra tu cuenta.</Text>
      <View style={styles.option}><Text style={styles.optionText}>Comunicaciones opcionales</Text><Switch accessibilityLabel="Permitir comunicaciones opcionales" value={state.optionalCommunications} disabled={state.busy} onValueChange={value => vm.setOptional('optionalCommunications', value)} /></View>
      <View style={styles.option}><Text style={styles.optionText}>Analítica opcional</Text><Switch accessibilityLabel="Permitir analítica opcional" value={state.optionalAnalytics} disabled={state.busy} onValueChange={value => vm.setOptional('optionalAnalytics', value)} /></View>
      {!deleting && state.error ? <Feedback kind="error" message={state.error} /> : null}
      {state.success ? <Feedback kind="success" message={state.success} /> : null}
      <Button title="Guardar mis decisiones" loading={state.busy} disabled={needsConsent && !state.accepted} onPress={() => { void vm.save(); }} />
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.title}>Acceso y rectificación</Text>
      <Text style={styles.body}>Consulta y corrige tu nombre y correo en Mi perfil. Para solicitudes adicionales, escribe al contacto indicado arriba. Nunca envíes tu contraseña por correo.</Text>
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.title}>Cancelar mi cuenta</Text>
      <Text style={styles.body}>{notice.cancellation}</Text>
      {deleting && state.error ? <Feedback kind="error" message={state.error} /> : null}
      {!deleting ? <Button title="Quiero cancelar mi cuenta" variant="secondary" icon={Trash2} disabled={state.busy} onPress={() => setDeleting(true)} /> : <>
        <PasswordField label="Contraseña actual para cancelar" value={password} onChangeText={setPassword} editable={!state.busy} maxLength={128} autoComplete="current-password" />
        <Field label="Escribe ELIMINAR MI CUENTA" value={confirmation} onChangeText={setConfirmation} editable={!state.busy} autoCapitalize="characters" autoCorrect={false} maxLength={40} />
        <Button title="Cancelar mi cuenta definitivamente" variant="danger" disabled={state.busy || password.length < 8 || confirmation !== 'ELIMINAR MI CUENTA'} onPress={() => setConfirming(true)} />
        <Button title="Conservar mi cuenta" variant="secondary" disabled={state.busy} onPress={() => { setDeleting(false); setPassword(''); setConfirmation(''); }} />
      </>}
    </Card>
    <ConfirmDialog visible={confirming} title="Cancelar tu cuenta de acceso" message="Se eliminarán tu cuenta y sus sesiones. Esta acción es definitiva y no borra los expedientes clínicos del laboratorio." confirmLabel="Cancelar mi cuenta" onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); const secret = password; setPassword(''); void vm.cancel(secret, confirmation); }} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 14, lineHeight: 23 },
  link: { color: colors.primary, fontSize: 14, lineHeight: 24 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 48 },
  checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: colors.primary, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  checked: { backgroundColor: colors.primary }, checkLabel: { flex: 1, color: colors.text, lineHeight: 22 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12 }, optionText: { flex: 1, color: colors.text, fontSize: 14 },
});
