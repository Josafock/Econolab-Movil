import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput } from 'react-native';
import { Info, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage, isCancelled } from '@/core/errors';
import { fieldMessages } from '@/core/validation';
import { Button, Card, colors, Feedback, Heading, IconBadge, Screen } from '@/ui';
import { updatePassword } from './api';
import { passwordChangeSchema } from './validation';
import ConfirmDialog from '@/ui/ConfirmDialog';
import ProfileCard from './ProfileCard';
import PasswordField from '@/ui/PasswordField';

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
  const [revision, setRevision] = useState(0);
  const pending = useRef<AbortController | null>(null);
  const saving = useRef(false);
  const newInput = useRef<TextInput>(null);
  const confirmationInput = useRef<TextInput>(null);
  const token = session?.token;
  useEffect(() => () => { pending.current?.abort(); }, [token]);
  if (!session) return null;

  async function save() {
    if (saving.current) return;
    const result = passwordChangeSchema.safeParse({ current_password: current, password, confirmation });
    setMessage(''); setSuccess(false);
    if (!result.success) {
      setFields(fieldMessages(result.error));
      return;
    }
    saving.current = true;
    const controller = new AbortController();
    pending.current = controller;
    setFields({}); setBusy(true);
    const values = result.data;
    setCurrent(''); setPassword(''); setConfirmation(''); setRevision(value => value + 1);
    Keyboard.dismiss();
    try {
      await updatePassword(values.current_password, values.password, controller.signal);
      if (!controller.signal.aborted) { setSuccess(true); setMessage('Tu contraseña se actualizó correctamente.'); }
    } catch (error) {
      if (!controller.signal.aborted && !isCancelled(error)) setMessage(errorMessage(error));
    } finally {
      saving.current = false;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  function edit(field: string, value: string, setter: (value: string) => void) {
    setter(value); setMessage(''); setSuccess(false);
    setFields(previous => ({ ...previous, [field]: '', ...(field === 'password' ? { confirmation: '' } : {}) }));
  }

  function requestConfirmation() {
    if (saving.current) return;
    const checked = passwordChangeSchema.safeParse({ current_password: current, password, confirmation });
    if (!checked.success) { void save(); return; }
    Keyboard.dismiss(); setConfirming(true);
  }

  return <Screen>
    <Heading eyebrow="Tu cuenta" title="Mi perfil" subtitle="Tu información de acceso a Econolab." />
    <ProfileCard disabled={busy} />
    <Card>
      <IconBadge icon={LockKeyhole} />
      <Text accessibilityRole="header" style={styles.title}>Cambiar contraseña</Text>
      <Text style={styles.note}>Usa de 8 a 128 caracteres, con mayúsculas, minúsculas, números y símbolos.</Text>
      <PasswordField key={`current-${revision}`} label="Contraseña actual" icon={KeyRound} value={current} onChangeText={value => edit('current_password', value, setCurrent)} error={fields.current_password} autoComplete="current-password" editable={!busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => newInput.current?.focus()} />
      <PasswordField key={`new-${revision}`} ref={newInput} label="Nueva contraseña" icon={LockKeyhole} value={password} onChangeText={value => edit('password', value, setPassword)} error={fields.password} autoComplete="new-password" editable={!busy} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationInput.current?.focus()} />
      <PasswordField key={`confirm-${revision}`} ref={confirmationInput} label="Confirmar nueva contraseña" icon={LockKeyhole} value={confirmation} onChangeText={value => edit('confirmation', value, setConfirmation)} error={fields.confirmation} autoComplete="new-password" editable={!busy} returnKeyType="done" onSubmitEditing={requestConfirmation} />
      {message ? <Feedback message={message} kind={success ? 'success' : 'error'} /> : null}
      <Button title="Actualizar contraseña" icon={ShieldCheck} loading={busy} onPress={requestConfirmation} />
    </Card>
    <Button title="Ayuda y uso de datos" icon={Info} variant="secondary" onPress={() => router.push('/about')} />
    <ConfirmDialog visible={confirming} title="Actualizar contraseña" message="¿Quieres guardar tu nueva contraseña?" confirmLabel="Actualizar" onConfirm={() => { setConfirming(false); void save(); }} onCancel={() => setConfirming(false)} />
  </Screen>;
}

const styles = StyleSheet.create({
  title: { fontSize: 19, fontWeight: '700', color: colors.text },
  note: { fontSize: 12, lineHeight: 20, color: colors.muted },
});
