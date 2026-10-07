import { useRef, useState } from 'react';
import { Keyboard, Text, TextInput, StyleSheet, Platform, View } from 'react-native';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';

import { errorMessage } from '@/core/errors';
import { Brand, Button, Card, Feedback, Field, Heading, IconButton, Screen, colors } from '@/ui';
import { credentialsSchema } from './api';
import { useAuth } from './AuthProvider';

export default function LoginScreen() {
  const auth = useAuth();
  const passwordInput = useRef<TextInput>(null);
  const submitting = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitError, setSubmitError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (submitting.current) return;
    const result = credentialsSchema.safeParse({ email, password });
    const attemptedPassword = password;
    setPassword('');
    setPasswordVisible(false);
    setSubmitError(undefined);
    if (!result.success) {
      const fields = result.error.flatten().fieldErrors;
      setFieldErrors({ email: fields.email?.[0], password: fields.password?.[0] });
      return;
    }
    setFieldErrors({});
    submitting.current = true;
    setBusy(true);
    Keyboard.dismiss();
    try {
      await auth.login(result.data.email, attemptedPassword);
    } catch (error) {
      setSubmitError(errorMessage(error));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <Screen topInset>
      <View style={styles.intro}><Text style={styles.overline}>ECONOLAB MÓVIL</Text></View>
      <Brand />
      {auth.notice ? <Feedback message={auth.notice} /> : null}
      <Card>
        <Heading title="Bienvenido" subtitle="Todo tu catálogo, en un solo lugar. Entra con tu cuenta de Econolab." />
        <Field
          label="Correo electrónico"
          icon={Mail}
          placeholder="tu.correo@ejemplo.com"
          value={email}
          onChangeText={setEmail}
          error={fieldErrors.email}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordInput.current?.focus()}
        />
        <Field
          ref={passwordInput}
          label="Contraseña"
          icon={LockKeyhole}
          placeholder="Escribe tu contraseña"
          rightAccessory={<IconButton icon={passwordVisible ? EyeOff : Eye} label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'} disabled={busy} onPress={() => setPasswordVisible((visible) => !visible)} />}
          value={password}
          onChangeText={setPassword}
          error={fieldErrors.password}
          secureTextEntry={!passwordVisible}
          textContentType="password"
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!busy}
          returnKeyType="go"
          onSubmitEditing={() => { void submit(); }}
        />
        {submitError ? <Feedback kind="error" message={submitError} /> : null}
        <Button title="Iniciar sesión" icon={ArrowRight} loading={busy} onPress={() => { void submit(); }} />
        <View style={styles.security}><ShieldCheck size={16} color={colors.muted} /><Text style={styles.securityText}>Tu cuenta, siempre contigo</Text></View>
      </Card>
      <Text style={styles.note}>
        Usa la misma cuenta que en la aplicación web. Si todavía no tienes acceso, contacta al administrador.
      </Text>
      {Platform.OS === 'web' ? (
        <Text style={styles.note}>En esta vista web, la sesión termina al recargar o cerrar la página.</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', paddingTop: 16 },
  overline: { color: colors.subtle, fontSize: 10, letterSpacing: 2.5, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 20, textAlign: 'center', paddingHorizontal: 12 },
  security: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  securityText: { color: colors.muted, fontSize: 12, flexShrink: 1 },
});
