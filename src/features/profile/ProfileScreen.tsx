import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/core/errors';
import { Button, Card, colors, Feedback, Field, Heading, IconBadge, Screen } from '@/ui';
import { updatePassword } from './api';
import { passwordChangeSchema } from './validation';
import ConfirmDialog from '@/ui/ConfirmDialog';
import ProfileCard from './ProfileCard';

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
    <ProfileCard disabled={busy} />
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
  note: { fontSize: 12, lineHeight: 20, color: colors.muted },
});
