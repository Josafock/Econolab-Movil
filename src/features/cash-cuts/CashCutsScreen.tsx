import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Wallet } from 'lucide-react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { errorMessage, isCancelled } from '@/core/errors';
import { Button, Card, colors, Feedback, Field, Heading, IconBadge, Loading, Screen } from '@/ui';
import { businessToday, formatCutDate, shiftDate, validatePeriod } from './dates';
import { formatCutMoney, getCashCut, type CashCut, type CutQuery } from './api';

const statusLabels = { pending: 'Pendiente', in_progress: 'En curso', delayed: 'Retrasado', completed: 'Concluido', cancelled: 'Cancelado' };

export default function CashCutsScreen() {
  const { session, profile } = useAuth();
  const allowed = !!session && (profile ?? session.usuario).rol === 'admin';
  const [fromDate, setFromDate] = useState(businessToday);
  const [toDate, setToDate] = useState(businessToday);
  const [branchName, setBranchName] = useState('');
  const [query, setQuery] = useState<CutQuery>(() => ({ fromDate: businessToday(), toDate: businessToday(), page: 1 }));
  const [report, setReport] = useState<CashCut | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState('');
  const [validation, setValidation] = useState('');
  const [refresh, setRefresh] = useState(0);
  const sequence = useRef(0);
  const request = useRef<AbortController | null>(null);
  const token = session?.token;

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    const id = ++sequence.current;
    let active = true;
    void Promise.resolve().then(async () => {
      if (!active || !allowed || !token) return;
      setLoading(true); setFailure(''); setReport(null);
      try {
        const response = await getCashCut(query, controller.signal);
        if (active && !controller.signal.aborted && id === sequence.current) setReport(response);
      } catch (error) {
        if (active && id === sequence.current && !isCancelled(error)) setFailure(errorMessage(error));
      } finally {
        if (active && id === sequence.current) setLoading(false);
      }
    });
    return () => { active = false; controller.abort(); sequence.current += 1; };
  }, [allowed, token, query, refresh]);

  const changeQuery = (next: CutQuery) => {
    request.current?.abort(); sequence.current += 1;
    setReport(null); setQuery(next);
  };
  const reload = () => {
    request.current?.abort(); sequence.current += 1;
    setReport(null); setRefresh(value => value + 1);
  };
  const apply = (from = fromDate, to = toDate) => {
    const error = validatePeriod(from, to);
    setValidation(error ?? '');
    if (!error) changeQuery({ fromDate: from, toDate: to, branchName: branchName.trim(), page: 1 });
  };
  const preset = (days: number) => {
    const today = businessToday();
    const first = shiftDate(today, days === -1 ? -1 : -days);
    const last = days === -1 ? first : today;
    setFromDate(first); setToDate(last); apply(first, last);
  };

  if (!allowed) return <Screen><Heading title="Acceso restringido" /><Feedback message="Solo un administrador puede consultar los cortes." /></Screen>;

  return <Screen>
    <Heading eyebrow="Control administrativo" title="Cortes" subtitle="Consulta los importes de los servicios por fecha y sucursal." />
    <Card>
      <View style={styles.filters}>
        {[{ label: 'Hoy', days: 0 }, { label: 'Ayer', days: -1 }, { label: 'Últimos 7 días', days: 6 }].map(item => <Pressable key={item.label} onPress={() => preset(item.days)} accessibilityRole="button" accessibilityLabel={`Corte: ${item.label}`} style={styles.chip}><Text style={styles.chipText}>{item.label}</Text></Pressable>)}
      </View>
      <Field label="Fecha inicial (AAAA-MM-DD)" icon={CalendarDays} value={fromDate} onChangeText={setFromDate} maxLength={10} autoCorrect={false} autoCapitalize="none" keyboardType="numbers-and-punctuation" placeholder="2026-10-20" />
      <Field label="Fecha final (AAAA-MM-DD)" icon={CalendarDays} value={toDate} onChangeText={setToDate} maxLength={10} autoCorrect={false} autoCapitalize="none" keyboardType="numbers-and-punctuation" placeholder="2026-10-20" />
      <Field label="Sucursal (opcional)" value={branchName} onChangeText={setBranchName} maxLength={150} placeholder="Todas las sucursales" />
      {validation ? <Feedback kind="error" message={validation} /> : null}
      <Button title="Consultar corte" icon={CalendarDays} onPress={() => apply()} />
      <Text style={styles.note}>Horario de Ciudad de México. El periodo incluye ambos días.</Text>
    </Card>
    {loading ? <Loading /> : null}
    {failure ? <Feedback kind="error" message={failure} onRetry={reload} /> : null}
    {report ? <>
      <View style={styles.period}><Text accessibilityRole="header" style={styles.heading}>Del {formatCutDate(report.period.fromDate)} al {formatCutDate(report.period.toDate)}</Text><Text style={styles.note}>{query.branchName || 'Todas las sucursales'}</Text></View>
      <Card>
        <IconBadge icon={Wallet} />
        <Text style={styles.label}>Importe neto registrado</Text>
        <Text accessibilityLabel={`Importe neto registrado: ${formatCutMoney(report.summary.totalAmount)} MXN`} style={styles.amount}>{formatCutMoney(report.summary.totalAmount)}<Text style={styles.currency}> MXN</Text></Text>
        <Text style={styles.note}>{report.summary.serviceCount} servicios incluidos · {report.summary.cancelledCount} cancelados excluidos</Text>
        <View style={styles.line}><Text style={styles.text}>Subtotal</Text><Text style={styles.value}>{formatCutMoney(report.summary.subtotalAmount)}</Text></View>
        <View style={styles.line}><Text style={styles.text}>Descuento por cortesía</Text><Text style={styles.value}>{formatCutMoney(report.summary.discountAmount)}</Text></View>
        <View style={styles.line}><Text style={styles.text}>Importe cancelado</Text><Text style={styles.value}>{formatCutMoney(report.summary.cancelledAmount)}</Text></View>
        <Text style={styles.note}>Los totales abarcan todo el periodo, no solo la página visible.</Text>
      </Card>
      <Feedback message="Este corte resume servicios por su fecha de registro. El sistema todavía no registra cobros, abonos ni retiros; estos importes no confirman el efectivo recibido." />
      {report.summary.totalCount === 0 ? <Card><Text accessibilityRole="header" style={styles.heading}>Sin servicios en este periodo</Text><Text style={styles.note}>Prueba otra fecha o consulta todas las sucursales.</Text></Card> : <>
        <Card><Text accessibilityRole="header" style={styles.heading}>Desglose por día</Text>{report.daily.map(day => <View key={day.date} style={styles.day}><View style={styles.line}><Text style={styles.value}>{formatCutDate(day.date)}</Text><Text style={styles.value}>{formatCutMoney(day.totalAmount)}</Text></View><Text style={styles.note}>{day.serviceCount} incluidos · {day.cancelledCount} cancelados</Text></View>)}</Card>
        <Text accessibilityRole="header" style={styles.heading}>Servicios del corte</Text>
        {report.data.map(row => <Card key={row.id}><View style={styles.line}><Text style={styles.heading}>{row.folio}</Text><Text style={[styles.status, row.status === 'cancelled' && styles.cancelled]}>{statusLabels[row.status]}</Text></View><Text style={styles.note}>{formatCutDate(row.date)} · {row.branchName || 'Sin sucursal'}</Text><Text style={styles.rowAmount}>{formatCutMoney(row.totalAmount)}</Text>{row.status === 'cancelled' ? <Text style={styles.cancelled}>Excluido del importe neto</Text> : null}</Card>)}
        <Text style={styles.note}>Página {report.meta.page} de {Math.max(1, Math.ceil(report.meta.total / report.meta.limit))} · {report.meta.total} servicios</Text>
        <Button title="Página anterior" icon={ChevronLeft} variant="secondary" disabled={report.meta.page <= 1} onPress={() => changeQuery({ ...query, page: report.meta.page - 1 })} />
        <Button title="Página siguiente" icon={ChevronRight} variant="secondary" disabled={report.meta.page * report.meta.limit >= report.meta.total} onPress={() => changeQuery({ ...query, page: report.meta.page + 1 })} />
      </>}
      <Button title="Actualizar corte" icon={RefreshCw} variant="secondary" onPress={reload} />
    </> : null}
  </Screen>;
}

const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 48, backgroundColor: colors.primarySoft, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 14, justifyContent: 'center' },
  chipText: { color: colors.primaryDark, fontSize: 13, fontWeight: '600' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 20 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '700', flexShrink: 1 },
  period: { gap: 6 },
  label: { color: colors.muted, fontSize: 14 },
  amount: { color: colors.text, fontSize: 32, fontWeight: '700', flexWrap: 'wrap' },
  currency: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  line: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  text: { color: colors.muted, fontSize: 14, flexShrink: 1 },
  value: { color: colors.text, fontSize: 14, fontWeight: '600' },
  day: { gap: 6, borderTopWidth: 1, borderColor: colors.border, paddingTop: 14 },
  rowAmount: { color: colors.text, fontSize: 23, fontWeight: '700' },
  status: { color: colors.info, backgroundColor: colors.infoSoft, fontSize: 11, fontWeight: '600', padding: 6, borderRadius: 8 },
  cancelled: { color: colors.danger, fontSize: 12 },
});
