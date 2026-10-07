import { forwardRef, useId, useState, type PropsWithChildren, type ReactNode } from 'react';
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
import { type LucideIcon } from 'lucide-react-native';

import { colors, layout } from './theme';

export { colors } from './theme';

/** El encabezado de Stack atiende el borde superior del dispositivo. */
export function Screen({ children, scroll = true, topInset = false }: PropsWithChildren<{ scroll?: boolean; topInset?: boolean }>) {
  const { width } = useWindowDimensions();
  const contentStyle = [styles.content, width >= 600 && styles.wideContent];

  return (
    <SafeAreaView edges={topInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right']} style={styles.screen}>
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

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <View accessible accessibilityLabel="Econolab. Laboratorio clínico" style={[styles.brand, compact && styles.compactBrand]}>
      <Image
        source={require('../../assets/econolab-brand.png')}
        style={compact ? styles.compactLogo : styles.logo}
        resizeMode="contain"
        accessible={false}
      />
      {!compact ? <Text style={styles.brandCaption}>Laboratorio clínico</Text> : null}
    </View>
  );
}

export function Heading({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
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
  icon?: LucideIcon;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon: Icon,
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
      {!loading && Icon ? <Icon size={19} color={secondary ? colors.primaryDark : colors.card} strokeWidth={1.8} /> : null}
      <Text style={[styles.buttonText, secondary && styles.secondaryButtonText]}>{title}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & { label: string; error?: string; icon?: LucideIcon; rightAccessory?: ReactNode };

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, style, onFocus, onBlur, accessibilityHint, icon: Icon, rightAccessory, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const labelId = useId();

  return (
    <View style={styles.field}>
      <Text nativeID={labelId} style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
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
          Icon && styles.inputWithIcon,
          rightAccessory ? styles.inputWithAccessory : null,
          inputProps.multiline && styles.multilineInput,
          inputProps.editable === false && styles.readOnlyInput,
          focused && styles.focusedInput,
          !!error && styles.invalidInput,
          style,
        ]}
      />
      {Icon ? <View pointerEvents="none" style={styles.fieldIcon}><Icon size={19} color={focused ? colors.primary : colors.subtle} strokeWidth={1.8} /></View> : null}
      {rightAccessory ? <View style={styles.fieldAccessory}>{rightAccessory}</View> : null}
      </View>
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

export function IconBadge({ icon: Icon, tone = 'red' }: { icon: LucideIcon; tone?: 'red' | 'blue' | 'green' }) {
  const ink = tone === 'red' ? colors.primary : tone === 'blue' ? colors.info : colors.success;
  const background = tone === 'red' ? colors.primarySoft : tone === 'blue' ? colors.infoSoft : colors.successSoft;
  return <View style={[styles.iconBadge, { backgroundColor: background }]}><Icon size={23} color={ink} strokeWidth={1.7} /></View>;
}

export function IconButton({ icon: Icon, label, onPress, disabled = false }: { icon: LucideIcon; label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressedButton]}>
    <Icon size={20} color={colors.muted} strokeWidth={1.8} />
  </Pressable>;
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
    padding: 22,
    paddingBottom: 28,
    gap: 20,
  },
  wideContent: { padding: 32 },
  brand: { alignItems: 'center', gap: 2, paddingVertical: 8 },
  compactBrand: { paddingVertical: 0 },
  logo: { width: '100%', maxWidth: 300, height: 96 },
  compactLogo: { width: 156, height: 49 },
  brandCaption: { color: colors.muted, fontSize: 12, letterSpacing: 1.3 },
  heading: { gap: 8 },
  title: { color: colors.text, fontSize: 28, fontWeight: '700', lineHeight: 35, letterSpacing: -0.7 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.8, textTransform: 'uppercase' },
  button: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButton: { backgroundColor: colors.surface, borderColor: colors.border },
  dangerButton: { backgroundColor: colors.danger, borderColor: colors.danger },
  focusedButton: { borderColor: colors.text },
  pressedButton: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  disabledButton: { opacity: 0.55 },
  buttonText: { color: colors.card, fontSize: 16, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  secondaryButtonText: { color: colors.primaryDark },
  field: { gap: 8 },
  label: { color: '#334155', fontSize: 13, fontWeight: '600' },
  inputContainer: { position: 'relative' },
  fieldIcon: { position: 'absolute', left: 15, top: 0, bottom: 0, justifyContent: 'center' },
  fieldAccessory: { position: 'absolute', right: 3, top: 2, bottom: 2, justifyContent: 'center' },
  inputWithIcon: { paddingLeft: 44 },
  inputWithAccessory: { paddingRight: 52 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  iconBadge: { height: 50, width: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  input: {
    minHeight: 52,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  multilineInput: { minHeight: 100, textAlignVertical: 'top' },
  readOnlyInput: { backgroundColor: '#f3f4f6', color: colors.muted },
  focusedInput: { borderColor: colors.primary },
  invalidInput: { borderColor: colors.danger },
  fieldError: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.radius,
    padding: 22,
    gap: layout.gap,
    boxShadow: '0px 4px 18px rgba(15, 23, 42, 0.035)',
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
