import { useRef, useState } from 'react';
import { Keyboard, Text, TextInput, StyleSheet, Platform } from 'react-native';

import { errorMessage } from '@/core/errors';
import { Brand, Button, Card, Feedback, Field, Heading, Screen, colors } from '@/ui';
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
    <Screen>
      <Brand />
      <Heading title="Bienvenido" subtitle="Inicia sesión para consultar los estudios de Econolab y tu información de cuenta." />
      {auth.notice ? <Feedback message={auth.notice} /> : null}
      <Card>
        <Field
          label="Correo electrónico"
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
        <Button
          title={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          variant="secondary"
          disabled={busy}
          onPress={() => setPasswordVisible((visible) => !visible)}
        />
        {submitError ? <Feedback kind="error" message={submitError} /> : null}
        <Button title="Iniciar sesión" loading={busy} onPress={() => { void submit(); }} />
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

const styles = StyleSheet.create({ note: { color: colors.muted, fontSize: 14, lineHeight: 22 } });
