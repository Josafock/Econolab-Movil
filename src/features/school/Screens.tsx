import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { BookOpen, ClipboardList, House, Plus, RotateCcw, ShieldCheck, UserRound, Wallet } from 'lucide-react-native';
import { Button, Card, colors, Feedback, Field, Heading, Loading, Screen } from '@/ui';
import ConfirmDialog from '@/ui/ConfirmDialog';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSchool } from './SchoolProvider';
import { getPublicResources } from '@/core/public-resources';
import { amountToCents, money, today } from './models';

const go = (path: string) => router.push(path as Href);
function Notice() { return <Text style={styles.note}>Espacio escolar de práctica. Utiliza datos ficticios; los importes no representan ventas ni cobros.</Text>; }
function Status() {
  const { vm, busy, failure, success, workspace } = useSchool();
  return <>{busy ? <Loading /> : null}{failure ? <Feedback kind="error" message={failure} onRetry={() => { void vm.load(); }} /> : null}
    {success ? <Feedback kind="success" message={success} /> : null}
    {!busy && !failure && !workspace ? <Button title="Cargar espacio" onPress={() => { void vm.load(); }} /> : null}</>;
}
export function HomeScreen() {
  const { workspace } = useSchool();
  const { profile, session, logout } = useAuth();
  const user = profile ?? session?.usuario;
  return <Screen>
    <Heading eyebrow="ECONOLAB AULA" title={'Hola, ' + (user?.nombre.split(' ')[0] ?? 'bienvenido')} subtitle="Organiza, registra y aprende." />
    <Notice /><Status />
    {workspace ? <Card><Text style={styles.title}>Tu espacio de práctica</Text>
      <Text style={styles.metric}>{workspace.catalog.filter(item => item.active).length} servicios disponibles</Text>
      <Text style={styles.body}>{workspace.activities.filter(item => !item.cancelled).length} actividades registradas</Text>
      <Text style={styles.body}>Cada cuenta conserva su propio catálogo y sus propios ejercicios.</Text>
    </Card> : null}
    <Button title="Explorar catálogo" icon={BookOpen} onPress={() => go('/catalog')} />
    <Button title="Registrar actividad" icon={ClipboardList} variant="secondary" onPress={() => go('/activities')} />
    {user?.rol === 'admin' ? <Button title="Consultar cortes por fecha" icon={Wallet} variant="secondary" onPress={() => go('/cash-cuts')} /> : null}
    <Button title="Mi perfil" icon={UserRound} variant="secondary" onPress={() => go('/profile')} />
    <Button title="Ayuda y privacidad" icon={ShieldCheck} variant="secondary" onPress={() => go('/about')} />
    <Button title="Cerrar sesión" variant="secondary" onPress={() => { void logout(); }} />
  </Screen>;
}
export function CatalogScreen() {
  const { workspace, vm, busy } = useSchool();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  async function save() {
    const priceCents = amountToCents(price);
    if (priceCents === null || name.trim().length < 2) { setError('Escribe un nombre y un importe válido con hasta dos decimales.'); return; }
    setError('');
    if (await vm.addItem({ name, description, priceCents })) { setName(''); setDescription(''); setPrice(''); setForm(false); }
  }
  const rows = workspace?.catalog.filter(item => (item.name + ' ' + item.description).toLocaleLowerCase('es').includes(search.trim().toLocaleLowerCase('es'))) ?? [];
  return <Screen><Heading title="Catálogo de servicios" subtitle="Ejemplos de organización para un centro escolar." /><Notice />
    <Field label="Buscar servicio" value={search} onChangeText={setSearch} maxLength={100} />
    <Button title={form ? 'Cerrar formulario' : 'Agregar servicio'} icon={Plus} variant="secondary" disabled={busy} onPress={() => setForm(!form)} />
    {form ? <Card><Text style={styles.title}>Nuevo servicio de práctica</Text>
      <Field label="Nombre del servicio" value={name} onChangeText={setName} maxLength={80} editable={!busy} />
      <Field label="Descripción" value={description} onChangeText={setDescription} maxLength={240} editable={!busy} />
      <Field label="Importe de ejemplo (MXN)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" maxLength={10} editable={!busy} placeholder="35.00" />
      {error ? <Feedback kind="error" message={error} /> : null}<Button title="Guardar servicio" disabled={busy} onPress={() => { void save(); }} />
    </Card> : null}
    <Status />
    {workspace && !rows.length ? <Text style={styles.body}>No hay servicios que coincidan con tu búsqueda.</Text> : null}
    {rows.map(item => <Card key={item.id}><Text style={styles.title}>{item.name}</Text>
      <Text style={styles.body}>{item.description || 'Sin descripción.'}</Text><Text style={styles.price}>{money(item.priceCents)}</Text>
      <Text style={styles.note}>{item.active ? 'Disponible' : 'Pausado'}</Text>
      <Button title={(item.active ? 'Pausar ' : 'Activar ') + item.name} variant="secondary" disabled={busy} onPress={() => { void vm.setActive(item.id, !item.active); }} />
    </Card>)}
  </Screen>;
}
export function ActivitiesScreen() {
  const { workspace, vm, busy } = useSchool();
  const [selected, setSelected] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [date, setDate] = useState(today());
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [reset, setReset] = useState(false);
  const item = workspace?.catalog.find(row => row.id === selected && row.active);
  return <Screen><Heading title="Actividades" subtitle="Registra ejercicios y observa cómo cambian tus resúmenes." /><Notice />
    <Card><Text style={styles.title}>Registrar una actividad</Text>
      <Text style={styles.body}>Selecciona un servicio:</Text>
      <View accessibilityRole="radiogroup">{workspace?.catalog.filter(row => row.active).map(row =>
        <Pressable key={row.id} accessibilityRole="radio" accessibilityLabel={row.name} accessibilityState={{ checked: selected === row.id, disabled: busy }} disabled={busy} onPress={() => setSelected(row.id)} style={[styles.choice, selected === row.id && styles.selected]}>
          <Text style={styles.body}>{selected === row.id ? '● ' : '○ '}{row.name} · {money(row.priceCents)}</Text>
        </Pressable>)}</View>
      <Field label="Cantidad" value={quantity} onChangeText={setQuantity} keyboardType="number-pad" maxLength={4} editable={!busy} />
      <Field label="Fecha (AAAA-MM-DD)" value={date} onChangeText={setDate} maxLength={10} editable={!busy} placeholder="2026-11-06" />
      {item && /^\d+$/.test(quantity) ? <Text style={styles.price}>Importe de práctica: {money(item.priceCents * Number(quantity))}</Text> : null}
      <Button title="Guardar actividad" disabled={busy || selected === null} onPress={() => { void vm.addActivity({ itemId: selected!, quantity: /^\d+$/.test(quantity) ? Number(quantity) : NaN, date }); }} />
    </Card><Status />
    {workspace && !workspace.activities.length ? <Text style={styles.body}>Todavía no tienes actividades. Registra la primera para practicar.</Text> : null}
    {workspace?.activities.map(row => <Card key={row.id}><Text style={styles.title}>{row.itemName}</Text>
      <Text style={styles.body}>{row.date} · Cantidad: {row.quantity}</Text><Text style={styles.price}>{money(row.totalCents)}</Text>
      <Text style={styles.note}>{row.cancelled ? 'Cancelada; se excluye del importe del corte.' : 'Registrada'}</Text>
      {!row.cancelled ? <Button title={'Cancelar actividad ' + row.id} variant="secondary" disabled={busy} onPress={() => setCancelId(row.id)} /> : null}
    </Card>)}
    {workspace ? <Button title="Reiniciar espacio de práctica" icon={RotateCcw} variant="secondary" disabled={busy} onPress={() => setReset(true)} /> : null}
    <ConfirmDialog visible={cancelId !== null} title="Cancelar actividad" message="La actividad seguirá en el historial y su importe dejará de contarse en el resumen." confirmLabel="Sí, cancelar actividad" onCancel={() => setCancelId(null)} onConfirm={() => { const id = cancelId; setCancelId(null); if (id !== null) void vm.cancel(id); }} />
    <ConfirmDialog visible={reset} title="Reiniciar ejercicios" message="Se borrarán tu catálogo y tus actividades de práctica. Volverás a los tres servicios de ejemplo. Tu cuenta y perfil se conservan." confirmLabel="Reiniciar ejercicios" onCancel={() => setReset(false)} onConfirm={() => { setReset(false); setSelected(null); void vm.reset(); }} />
  </Screen>;
}
export function CutsScreen() {
  const { vm, busy, cut } = useSchool();
  const { profile, session } = useAuth();
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  if ((profile ?? session?.usuario)?.rol !== 'admin') return <Screen><Heading title="Acceso restringido" subtitle="Este resumen corresponde al rol administrador." /><Button title="Volver al inicio" onPress={() => router.replace('/')} /></Screen>;
  return <Screen><Heading title="Cortes por fecha" subtitle="Resumen de actividades registradas en tu espacio escolar." /><Notice />
    <Card><Field label="Desde (AAAA-MM-DD)" value={from} onChangeText={setFrom} maxLength={10} editable={!busy} />
      <Field label="Hasta (AAAA-MM-DD)" value={to} onChangeText={setTo} maxLength={10} editable={!busy} />
      <Button title="Consultar resumen" icon={Wallet} disabled={busy} onPress={() => { void vm.searchCut(from, to); }} /></Card>
    <Status />
    {cut ? <><Card><Text style={styles.title}>{cut.from} al {cut.to}</Text><Text style={styles.metric}>{money(cut.totalCents)}</Text>
      <Text style={styles.body}>{cut.count} actividades incluidas · {cut.cancelledCount} canceladas</Text>
      <Text style={styles.note}>Importes de ejercicios. No confirma pagos ni efectivo recibido.</Text></Card>
      {!cut.activities.length ? <Text style={styles.body}>No hay actividades en este periodo.</Text> : null}
      {cut.activities.map(row => <Card key={row.id}><Text style={styles.title}>{row.itemName}</Text><Text style={styles.body}>{row.date} · {money(row.totalCents)}{row.cancelled ? ' · Cancelada' : ''}</Text></Card>)}</> : null}
  </Screen>;
}
export function HelpScreen() {
  const resources = getPublicResources();
  const [failure, setFailure] = useState('');
  async function open(url: string) { try { await Linking.openURL(url); } catch { setFailure('No pudimos abrir el enlace. Vuelve a intentarlo.'); } }
  return <Screen><Heading eyebrow="ECONOLAB AULA" title="Aprende a organizar" subtitle="Proyecto escolar de práctica administrativa." />
    <Card><Text style={styles.title}>Qué puedes hacer</Text><Text style={styles.body}>Crear servicios genéricos, buscar y pausar elementos del catálogo, registrar cantidades y fechas, cancelar actividades y consultar resúmenes. Cada cuenta dispone de un espacio independiente.</Text></Card>
    <Card><Text style={styles.title}>Datos de demostración</Text><Text style={styles.body}>El catálogo comienza con impresión, encuadernado y asesoría de informática. Usa nombres y registros ficticios en tus ejercicios. Los importes sirven para aprender y no procesan pagos.</Text></Card>
    <Card><Text style={styles.title}>Tu cuenta</Text><Text style={styles.body}>Para entrar necesitas una cuenta de práctica autorizada. En Mi perfil puedes modificar nombre, correo y contraseña. En Privacidad y mis datos puedes consultar el aviso y solicitar la eliminación de la cuenta.</Text></Card>
    {resources.privacyUrl ? <Button title="Política de privacidad" icon={ShieldCheck} variant="secondary" onPress={() => { void open(resources.privacyUrl!); }} /> : null}
    {resources.supportEmail ? <Button title="Contactar soporte" variant="secondary" onPress={() => { void open('mailto:' + resources.supportEmail); }} /> : null}
    {failure ? <Feedback kind="error" message={failure} /> : null}
    <Button title="Volver al inicio" icon={House} variant="secondary" onPress={() => router.replace('/')} />
  </Screen>;
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 19, fontWeight: '700' },
  body: { color: colors.text, fontSize: 15, lineHeight: 23 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  price: { color: colors.primaryDark, fontSize: 22, fontWeight: '700' },
  metric: { color: colors.text, fontSize: 26, fontWeight: '700' },
  choice: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginVertical: 4 },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
});
