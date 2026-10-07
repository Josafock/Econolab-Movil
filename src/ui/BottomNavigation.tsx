import { router, usePathname, type Href } from 'expo-router';
import { FlaskConical, House, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

const tabs = [
  { label: 'Inicio', href: '/' as Href, icon: House, matches: (path: string) => path === '/' },
  { label: 'Estudios', href: '/studies' as Href, icon: FlaskConical, matches: (path: string) => path.startsWith('/studies') },
  { label: 'Perfil', href: '/profile' as Href, icon: UserRound, matches: (path: string) => path === '/profile' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  return <View style={[styles.navigation, { paddingBottom: Math.max(insets.bottom, 10), paddingLeft: Math.max(insets.left, 10), paddingRight: Math.max(insets.right, 10) }]}>
    {tabs.map(({ label, href, icon: Icon, matches }) => {
      const selected = matches(pathname);
      return <Pressable key={label} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected }} onPress={() => router.navigate(href)} style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && { opacity: 0.7 }]}>
        <Icon size={21} strokeWidth={selected ? 2 : 1.7} color={selected ? colors.primary : colors.muted} />
        <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  navigation: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card, paddingTop: 9 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 54, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 16 },
  selected: { backgroundColor: colors.primarySoft },
  label: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  selectedLabel: { color: colors.primaryDark, fontWeight: '700' },
});
