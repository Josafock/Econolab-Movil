import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyRound, Mail, Pencil, RefreshCw, Save, ShieldCheck, UserRound } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import type { User } from '@/features/auth/session';
import { errorMessage, isCancelled } from '@/core/errors';
import { Button, Card, colors, Feedback, Field, Loading } from '@/ui';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { getProfile, updateProfile } from './api';
import { profileChangeSchema } from './validation';

export default function ProfileCard({ disabled = false }: { disabled?: boolean }) {
  const { session, applyProfile } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const sequence = useRef(0);
  const saving = useRef(false);
  const token = session?.token;
  const userId = session?.usuario.id;

  const load = useCallback(async () => {
    if (!token || !userId) return;
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    const id = ++sequence.current;
    setLoading(true); setError(''); setMessage('');
    try {
      const profile = await getProfile(userId, pending.signal);
      if (pending.signal.aborted || sequence.current !== id || !applyProfile(profile, token)) return;
      setUser(profile);
    } catch (failure) {
      if (!pending.signal.aborted && sequence.current === id && !isCancelled(failure)) setError(errorMessage(failure));
    } finally {
      if (!pending.signal.aborted && sequence.current === id) setLoading(false);
    }
  }, [token, userId, applyProfile]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => { if (active) void load(); });
    return () => { active = false; controller.current?.abort(); sequence.current += 1; };
  }, [load]);

  const emailChanged = !!user && email.trim().toLowerCase() !== user.email.toLowerCase();
  const validate = () => {
    const result = profileChangeSchema.safeParse({ nombre, email });
    const issues = result.success ? {} : Object.fromEntries(result.error.issues.map(issue => [String(issue.path[0]), issue.message]));
    if (emailChanged && !password) issues.current_password = 'Confirma tu contraseña para cambiar el correo.';
    setFields(issues);
    return result.success && Object.keys(issues).length === 0 ? result.data : null;
  };

  const save = async () => {
    setConfirming(false);
    if (saving.current || !token || !userId) return;
    const values = validate();
    if (!values) return;
    saving.current = true; setBusy(true); setError(''); setMessage('');
    controller.current?.abort();
    const pending = new AbortController();
    controller.current = pending;
    const id = ++sequence.current;
    const currentPassword = password;
    setPassword('');
    try {
      const profile = await updateProfile(userId, values, emailChanged ? currentPassword : undefined, pending.signal);
      if (pending.signal.aborted || sequence.current !== id || !applyProfile(profile, token)) return;
      setUser(profile); setEditing(false); setMessage('Tu perfil se actualizó correctamente.');
    } catch (failure) {
      if (!pending.signal.aborted && sequence.current === id && !isCancelled(failure)) setError(errorMessage(failure));
    } finally {
      saving.current = false;
      if (!pending.signal.aborted && sequence.current === id) setBusy(false);
    }
  };

  return <Card>
    {loading ? <Loading /> : null}
    {!loading && user ? <>
      <View style={styles.top}><View style={styles.avatar}><Text style={styles.initial}>{user.nombre.trim().charAt(0).toUpperCase()}</Text></View><View style={styles.badge}><ShieldCheck size={14} color={colors.primary} /><Text style={styles.role}>{user.rol === 'admin' ? 'Administrador' : 'Recepcionista'}</Text></View></View>
      {editing ? <>
        <Field label="Nombre" icon={UserRound} value={nombre} onChangeText={setNombre} error={fields.nombre} maxLength={50} editable={!busy && !disabled} autoComplete="name" />
        <Field label="Correo electrónico" icon={Mail} value={email} onChangeText={setEmail} error={fields.email} maxLength={50} editable={!busy && !disabled} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" />
        <Text style={styles.note}>Si cambias el correo, será el que uses para iniciar sesión.</Text>
        {emailChanged ? <Field label="Confirma tu contraseña" icon={KeyRound} value={password} onChangeText={setPassword} error={fields.current_password} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="current-password" maxLength={128} editable={!busy && !disabled} /> : null}
        <Button title="Guardar perfil" icon={Save} loading={busy} disabled={disabled} onPress={() => { if (validate()) setConfirming(true); }} />
        <Button title="Cancelar edición" variant="secondary" disabled={busy || disabled} onPress={() => { setEditing(false); setPassword(''); setFields({}); setError(''); }} />
      </> : <>
        <View style={styles.identity}><Text style={styles.label}>Nombre</Text><Text selectable style={styles.name}>{user.nombre}</Text></View>
        <View style={styles.identity}><Text style={styles.label}>Correo electrónico</Text><Text selectable style={styles.email}>{user.email}</Text></View>
        <Button title="Editar perfil" icon={Pencil} variant="secondary" disabled={disabled || !!error} onPress={() => { setNombre(user.nombre); setEmail(user.email); setPassword(''); setFields({}); setMessage(''); setEditing(true); }} />
        <Button title="Actualizar perfil" icon={RefreshCw} variant="secondary" disabled={disabled} onPress={() => { void load(); }} />
      </>}
    </> : null}
    {error ? <Feedback kind="error" message={error} onRetry={editing ? undefined : () => { void load(); }} /> : null}
    {message ? <Feedback kind="success" message={message} /> : null}
    <ConfirmDialog visible={confirming} title="Guardar perfil" message="¿Quieres guardar los cambios de tu nombre y correo?" confirmLabel="Guardar cambios" onConfirm={() => { void save(); }} onCancel={() => setConfirming(false)} />
  </Card>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  avatar: { backgroundColor: colors.primarySoft, height: 64, width: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initial: { fontSize: 27, fontWeight: '700', color: colors.primary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  role: { fontSize: 11, color: colors.primaryDark, fontWeight: '600' },
  identity: { gap: 5 },
  label: { fontSize: 12, color: colors.muted },
  name: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: colors.text },
  email: { fontSize: 14, lineHeight: 22, color: colors.text },
  note: { fontSize: 12, lineHeight: 20, color: colors.muted },
});
