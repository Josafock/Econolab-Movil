import { forwardRef, useId, useState, type PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout } from './theme';

export { colors } from './theme';

/** El encabezado de Stack atiende el borde superior del dispositivo. */
export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const { width } = useWindowDimensions();
  const contentStyle = [styles.content, width >= 600 && styles.wideContent];

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.fill}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={contentStyle}>{children}</View>
          </ScrollView>
        ) : (
          <View style={[...contentStyle, styles.fill]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Brand() {
  return (
    <View accessible accessibilityLabel="Econolab. Laboratorio clínico" style={styles.brand}>
      <Image
        source={require('../../assets/econolab-logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessible={false}
      />
      <View style={styles.brandText}>
        <Text style={styles.wordmark}>ECONOLAB</Text>
        <Text style={styles.brandCaption}>Laboratorio clínico</Text>
      </View>
    </View>
  );
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.heading}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const [focused, setFocused] = useState(false);
  const unavailable = disabled || loading;
  const secondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      disabled={unavailable}
      accessibilityRole="button"
      accessibilityLabel={loading ? `${title}. En proceso` : title}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        focused && styles.focusedButton,
        pressed && !unavailable && styles.pressedButton,
        unavailable && styles.disabledButton,
      ]}
    >
      {loading ? <ActivityIndicator color={secondary ? colors.primary : colors.card} /> : null}
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string };

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, style, onFocus, onBlur, accessibilityHint, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const labelId = useId();

  return (
    <View style={styles.field}>
      <Text nativeID={labelId} style={styles.label}>{label}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={label}
        accessibilityLabelledBy={labelId}
        accessibilityHint={error || accessibilityHint}
        placeholderTextColor={colors.muted}
        selectionColor={colors.primary}
        {...inputProps}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          inputProps.multiline && styles.multilineInput,
          inputProps.editable === false && styles.readOnlyInput,
          focused && styles.focusedInput,
          !!error && styles.invalidInput,
          style,
        ]}
      />
      {error ? (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.fieldError}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function Feedback({
  message,
  kind = 'info',
  onRetry,
}: {
  message: string;
  kind?: 'error' | 'info' | 'success';
  onRetry?: () => void;
}) {
  const title = { error: 'No se pudo completar', info: 'Aviso', success: 'Listo' }[kind];

  return (
    <View style={[
      styles.feedback,
      kind === 'error' && styles.errorFeedback,
      kind === 'success' && styles.successFeedback,
    ]}>
      <Text style={[
        styles.feedbackTitle,
        kind === 'error' && styles.errorText,
        kind === 'success' && styles.successText,
      ]}>{title}</Text>
      <Text
        accessibilityRole={kind === 'error' ? 'alert' : 'text'}
        accessibilityLiveRegion="polite"
        style={styles.feedbackMessage}
      >
        {message}
      </Text>
      {onRetry ? <Button title="Volver a intentar" onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading} accessibilityState={{ busy: true }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text accessibilityLiveRegion="polite" style={styles.subtitle}>Cargando…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: layout.maxWidth,
    padding: 20,
    paddingBottom: 28,
    gap: 20,
  },
  wideContent: { padding: 32 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  logo: { width: 42, height: 60, borderRadius: 8 },
  brandText: { flex: 1, gap: 4 },
  wordmark: { color: colors.primary, fontSize: 25, fontWeight: '800', letterSpacing: 1.1 },
  brandCaption: { color: colors.muted, fontSize: 14 },
  heading: { gap: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', lineHeight: 36 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24 },
  button: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 2,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButton: { backgroundColor: colors.card, borderColor: colors.border },
  dangerButton: { backgroundColor: colors.danger, borderColor: colors.danger },
  focusedButton: { borderColor: colors.text },
  pressedButton: { opacity: 0.8 },
  disabledButton: { opacity: 0.55 },
  buttonText: { color: colors.card, fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondaryButtonText: { color: colors.primaryDark },
  field: { gap: 8 },
  label: { color: colors.text, fontSize: 15, fontWeight: '600' },
  input: {
    minHeight: 52,
    color: colors.text,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  readOnlyInput: { backgroundColor: '#f3f4f6', color: colors.muted },
  focusedInput: { borderColor: colors.primary },
  invalidInput: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: layout.radius,
    padding: 20,
    gap: layout.gap,
  },
  feedback: {
    backgroundColor: colors.infoSoft,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  errorFeedback: { backgroundColor: colors.primarySoft, borderLeftColor: colors.danger },
  successFeedback: { backgroundColor: colors.successSoft, borderLeftColor: colors.success },
  feedbackTitle: { color: colors.info, fontSize: 16, fontWeight: '700' },
  errorText: { color: colors.danger },
  successText: { color: colors.success },
  feedbackMessage: { color: colors.text, fontSize: 15, lineHeight: 23 },
  loading: { padding: 32, gap: 16, alignItems: 'center', justifyContent: 'center' },
});
