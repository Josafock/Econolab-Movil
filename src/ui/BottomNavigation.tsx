import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, usePathname, type Href } from 'expo-router';
import { BookOpen, ClipboardList, House, UserRound, Wallet } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from './theme';
export default function BottomNavigation() {
  const path = usePathname();
  const { session, profile } = useAuth();
  const links = [{ path: '/', title: 'Inicio', Icon: House }, { path: '/catalog', title: 'Catálogo', Icon: BookOpen },
    { path: '/activities', title: 'Actividad', Icon: ClipboardList },
    ...((profile ?? session?.usuario)?.rol === 'admin' ? [{ path: '/cash-cuts', title: 'Cortes', Icon: Wallet }] : []),
    { path: '/profile', title: 'Perfil', Icon: UserRound }];
  return <View accessibilityRole="tablist" style={styles.bar}>{links.map(({ path: href, title, Icon }) => {
    const selected = path === href;
    return <Pressable key={href} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{ selected }} onPress={() => router.replace(href as Href)} style={styles.tab}>
      <Icon size={21} color={selected ? colors.primary : colors.muted} /><Text style={[styles.label, selected && { color: colors.primary }]}>{title}</Text>
    </Pressable>;
  })}</View>;
}
const styles = StyleSheet.create({ bar: { flexDirection: 'row', backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.border, paddingBottom: 8 }, tab: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 }, label: { fontSize: 11, color: colors.muted } });
