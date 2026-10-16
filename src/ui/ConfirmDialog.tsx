import { Modal, StyleSheet, Text, View } from 'react-native';
import { Button, colors } from '@/ui';

export default function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: {
  visible: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.dialog}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Button title={confirmLabel} onPress={onConfirm} />
      <Button title="Cancelar" onPress={onCancel} variant="secondary" />
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#00000080', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', maxWidth: 480, backgroundColor: colors.card, borderRadius: 16, padding: 24, gap: 18 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  message: { color: colors.muted, fontSize: 16, lineHeight: 24 },
});
