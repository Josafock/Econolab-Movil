import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage } from '@/core/errors';
import { Button, Card, colors, Feedback, Field, Heading, Screen } from '@/ui';
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
    <Heading title="Mi perfil" subtitle="Tu información de acceso a ECONOLAB." />
    <Card>
      <Field label="Nombre" value={session.usuario.nombre} editable={false} />
      <Field label="Correo electrónico" value={session.usuario.email} editable={false} />
      <Text style={styles.label}>Rol: {session.usuario.rol === 'admin' ? 'Administrador' : 'Recepcionista'}</Text>
      <Text style={styles.note}>Información recibida al iniciar sesión.</Text>
    </Card>
    <Card>
      <Text accessibilityRole="header" style={styles.title}>Cambiar contraseña</Text>
      <Text style={styles.note}>Usa de 8 a 128 caracteres, con mayúsculas, minúsculas, números y símbolos.</Text>
      <Field label="Contraseña actual" value={current} onChangeText={setCurrent} error={fields.current_password} secureTextEntry autoComplete="current-password" editable={!busy} />
      <Field label="Nueva contraseña" value={password} onChangeText={setPassword} error={fields.password} secureTextEntry autoComplete="new-password" editable={!busy} maxLength={128} />
      <Field label="Confirmar nueva contraseña" value={confirmation} onChangeText={setConfirmation} error={fields.confirmation} secureTextEntry autoComplete="new-password" editable={!busy} maxLength={128} />
      {message ? <Feedback message={message} kind={success ? 'success' : 'error'} /> : null}
      <Button title="Actualizar contraseña" loading={busy} onPress={() => {
        const checked = passwordChangeSchema.safeParse({ current_password: current, password, confirmation });
        if (!checked.success) { void save(); return; }
        setConfirming(true);
      }} />
    </Card>
    <ConfirmDialog visible={confirming} title="Actualizar contraseña" message="¿Quieres guardar tu nueva contraseña?" confirmLabel="Actualizar" onConfirm={() => { setConfirming(false); void save(); }} onCancel={() => setConfirming(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { fontSize: 21, fontWeight: '700', color: colors.text },
  label: { fontSize: 16, color: colors.text },
  note: { fontSize: 14, lineHeight: 21, color: colors.muted },
});
