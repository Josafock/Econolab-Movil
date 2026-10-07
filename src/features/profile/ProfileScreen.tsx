import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/core/errors';
import { Button, Card, colors, Feedback, Field, Heading, IconBadge, Screen } from '@/ui';
import { updatePassword } from './api';
import { passwordChangeSchema } from './validation';
import ConfirmDialog from '@/ui/ConfirmDialog';

export default function ProfileScreen() {
  const { session } = useAuth();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  if (!session) return null;

  async function save() {
    if (busy) return;
    const result = passwordChangeSchema.safeParse({ current_password: current, password, confirmation });
    setMessage(''); setSuccess(false);
    if (!result.success) {
      setFields(Object.fromEntries(result.error.issues.map(issue => [String(issue.path[0]), issue.message])));
      return;
    }
    setFields({}); setBusy(true);
    const values = result.data;
    try {
      await updatePassword(values.current_password, values.password);
      setSuccess(true); setMessage('Tu contraseña se actualizó correctamente.');
    } catch (error) { setMessage(errorMessage(error)); }
    finally { setCurrent(''); setPassword(''); setConfirmation(''); setBusy(false); }
  }

  return <Screen>
    <Heading eyebrow="Tu cuenta" title="Mi perfil" subtitle="Tu información de acceso a Econolab." />
    <Card>
      <View style={styles.profileTop}><View style={styles.avatar}><Text style={styles.initial}>{session.usuario.nombre.trim().charAt(0).toUpperCase()}</Text></View><View style={styles.roleBadge}><ShieldCheck size={14} color={colors.primary} /><Text style={styles.role}>{session.usuario.rol === 'admin' ? 'Administrador' : 'Recepcionista'}</Text></View></View>
      <View style={styles.identity}><Text style={styles.label}>Nombre</Text><Text selectable style={styles.name}>{session.usuario.nombre}</Text></View>
      <View style={styles.identity}><Text style={styles.label}>Correo electrónico</Text><Text selectable style={styles.email}>{session.usuario.email}</Text></View>
      <Text style={styles.note}>Información recibida al iniciar sesión.</Text>
    </Card>
    <Card>
      <IconBadge icon={LockKeyhole} />
      <Text accessibilityRole="header" style={styles.title}>Cambiar contraseña</Text>
      <Text style={styles.note}>Usa de 8 a 128 caracteres, con mayúsculas, minúsculas, números y símbolos.</Text>
      <Field label="Contraseña actual" icon={KeyRound} value={current} onChangeText={setCurrent} error={fields.current_password} secureTextEntry autoComplete="current-password" autoCapitalize="none" autoCorrect={false} editable={!busy} />
      <Field label="Nueva contraseña" icon={LockKeyhole} value={password} onChangeText={setPassword} error={fields.password} secureTextEntry autoComplete="new-password" autoCapitalize="none" autoCorrect={false} editable={!busy} maxLength={128} />
      <Field label="Confirmar nueva contraseña" icon={LockKeyhole} value={confirmation} onChangeText={setConfirmation} error={fields.confirmation} secureTextEntry autoComplete="new-password" autoCapitalize="none" autoCorrect={false} editable={!busy} maxLength={128} />
      {message ? <Feedback message={message} kind={success ? 'success' : 'error'} /> : null}
      <Button title="Actualizar contraseña" icon={ShieldCheck} loading={busy} onPress={() => {
        const checked = passwordChangeSchema.safeParse({ current_password: current, password, confirmation });
        if (!checked.success) { void save(); return; }
        setConfirming(true);
      }} />
    </Card>
    <ConfirmDialog visible={confirming} title="Actualizar contraseña" message="¿Quieres guardar tu nueva contraseña?" confirmLabel="Actualizar" onConfirm={() => { setConfirming(false); void save(); }} onCancel={() => setConfirming(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { fontSize: 19, fontWeight: '700', color: colors.text },
  profileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  avatar: { backgroundColor: colors.primarySoft, height: 64, width: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 27, fontWeight: '700', color: colors.primary },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  role: { fontSize: 11, color: colors.primaryDark, fontWeight: '600' },
  identity: { gap: 5 },
  label: { fontSize: 12, color: colors.muted },
  name: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, lineHeight: 22, color: colors.text },
  note: { fontSize: 12, lineHeight: 20, color: colors.muted },
});
