import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, FlaskConical, Package, Search, SearchX } from 'lucide-react-native';

import { errorMessage } from '@/core/errors';
import { Button, Card, colors, Feedback, Field, Heading, IconBadge, Loading, Screen } from '@/ui';
import {
  formatPrice, listStudies, studyTypeLabels,
  type Study, type StudiesResponse, type StudyStatus, type StudyType,
} from './api';

type LoadMode = 'initial' | 'refresh' | 'more';
type LoadFailure = { message: string; page: number; mode: LoadMode };

const typeOptions: { value: StudyType | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'study', label: 'Individuales' },
  { value: 'package', label: 'Paquetes' },
  { value: 'other', label: 'Otros' },
];
const statusOptions: { value: StudyStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'suspended', label: 'Suspendidos' },
];

export default function StudiesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState<StudyType | 'all'>('all');
  const [status, setStatus] = useState<StudyStatus | 'all'>('all');
  const [studies, setStudies] = useState<Study[]>([]);
  const [meta, setMeta] = useState<StudiesResponse['meta'] | null>(null);
  const [loading, setLoading] = useState<LoadMode | null>('initial');
  const [failure, setFailure] = useState<LoadFailure | null>(null);
  const requestRef = useRef<{ controller: AbortController; sequence: number } | null>(null);
  const sequenceRef = useRef(0);
  const listRef = useRef<FlatList<Study>>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(async (page: number, mode: LoadMode) => {
    requestRef.current?.controller.abort();
    const controller = new AbortController();
    const sequence = ++sequenceRef.current;
    requestRef.current = { controller, sequence };
    setLoading(mode);
    setFailure(null);

    try {
      const response = await listStudies({
        page,
        search: debouncedSearch,
        type: type === 'all' ? undefined : type,
        status: status === 'all' ? undefined : status,
        signal: controller.signal,
      });
      if (controller.signal.aborted || sequence !== sequenceRef.current) return;
      setStudies((previous) => mode === 'more'
        ? Array.from(new Map([...previous, ...response.data].map((study) => [study.id, study])).values())
        : response.data);
      setMeta(response.meta);
    } catch (error) {
      if (controller.signal.aborted || sequence !== sequenceRef.current) return;
      setFailure({
        message: errorMessage(error),
        page,
        mode,
      });
    } finally {
      if (!controller.signal.aborted && sequence === sequenceRef.current) setLoading(null);
    }
  }, [debouncedSearch, type, status]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setStudies([]);
      setMeta(null);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      void loadPage(1, 'initial');
    });
    return () => {
      active = false;
      requestRef.current?.controller.abort();
      sequenceRef.current += 1;
    };
  }, [loadPage]);

  const searching = search.trim() !== debouncedSearch;
  const hasNextPage = !!meta && meta.page * meta.limit < meta.total;
  const retry = failure ? () => void loadPage(failure.page, failure.mode) : undefined;

  return (
    <Screen scroll={false}>
      <FlatList
        ref={listRef}
        data={studies}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshing={loading === 'refresh'}
        onRefresh={() => { if (!searching) void loadPage(1, 'refresh'); }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Heading eyebrow="Catálogo del laboratorio" title="Estudios" subtitle="Encuentra lo que necesitas, consulta sus precios y revisa cada detalle." />
            <Field
              label="Buscar estudio"
              icon={Search}
              placeholder="Nombre, clave o descripción"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              returnKeyType="search"
              maxLength={200}
              accessibilityHint="El catálogo se actualiza al terminar de escribir."
            />
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Tipo</Text>
              <View style={styles.chips}>
                {typeOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setType(option.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`Tipo: ${option.label}`}
                    accessibilityState={{ checked: type === option.value }}
                    style={[styles.chip, type === option.value && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, type === option.value && styles.chipTextSelected]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>Estado</Text>
              <View style={styles.chips}>
                {statusOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => setStatus(option.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={`Estado: ${option.label}`}
                    accessibilityState={{ checked: status === option.value }}
                    style={[styles.chip, status === option.value && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, status === option.value && styles.chipTextSelected]}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.summary}>
              {searching ? 'Preparando búsqueda…' : meta
                ? `${meta.total} ${meta.total === 1 ? 'resultado' : 'resultados'} · precios en MXN`
                : 'Catálogo de ECONOLAB'}
            </Text>
            {failure && failure.mode !== 'more'
              ? <Feedback message={failure.message} kind="error" onRetry={retry} />
              : null}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/studies/[id]', params: { id: String(item.id) } })}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, clave ${item.code}, ${formatPrice(item.normalPrice)}. Ver detalle.`}
            style={({ pressed }) => pressed ? styles.pressed : undefined}
          >
            <Card>
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <View style={styles.studyIdentity}><IconBadge icon={item.type === 'package' ? Package : FlaskConical} tone={item.type === 'package' ? 'blue' : 'red'} /><Text style={styles.code}>{item.code}</Text></View>
                  <Text style={[styles.badge, item.status === 'suspended' ? styles.suspended : styles.active]}>
                    {item.status === 'active' ? 'Activo' : 'Suspendido'}
                  </Text>
                </View>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.muted}>{studyTypeLabels[item.type]}</Text>
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.priceLabel}>Precio normal</Text>
                    <Text style={styles.price}>{formatPrice(item.normalPrice)}</Text>
                  </View>
                  <View style={styles.detailLink}><Text style={styles.detailText}>Ver detalle</Text><ChevronRight size={16} color={colors.primary} /></View>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={loading ? <Loading /> : failure ? null : (
          <Card>
            <IconBadge icon={SearchX} />
            <Text style={styles.emptyTitle}>No encontramos estudios</Text>
            <Text style={styles.emptyText}>Prueba con otra palabra o cambia los filtros.</Text>
            {(search || type !== 'all' || status !== 'all') ? (
              <Button
                title="Limpiar búsqueda"
                variant="secondary"
                onPress={() => { setSearch(''); setType('all'); setStatus('all'); }}
              />
            ) : null}
          </Card>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            {failure?.mode === 'more' ? <Feedback message={failure.message} kind="error" onRetry={retry} /> : null}
            {loading === 'more' ? <Loading /> : hasNextPage && !failure ? (
              <Button
                title="Cargar más estudios"
                variant="secondary"
                disabled={!!loading || searching}
                onPress={() => { if (meta) void loadPage(meta.page + 1, 'more'); }}
              />
            ) : null}
            {meta && studies.length > 0 ? (
              <Text style={styles.summary}>
                Mostrando {studies.length} de {meta.total}
                {!hasNextPage ? ' · Fin del catálogo' : ''}
              </Text>
            ) : null}
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 28 },
  header: { gap: 18, paddingBottom: 18 },
  filterGroup: { gap: 8 },
  filterLabel: { color: colors.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  chipSelected: { backgroundColor: colors.primarySoft, borderColor: '#fecaca' },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '500' },
  chipTextSelected: { color: colors.primaryDark, fontWeight: '700' },
  summary: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  cardContent: { gap: 12 },
  studyIdentity: { flexDirection: 'row', gap: 10, alignItems: 'center', flex: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  code: { color: colors.muted, fontSize: 11, fontWeight: '600', flexShrink: 1, letterSpacing: 0.5 },
  badge: { fontSize: 12, fontWeight: '600', paddingVertical: 4, paddingHorizontal: 9, borderRadius: 12, overflow: 'hidden' },
  active: { color: colors.success, backgroundColor: colors.successSoft },
  suspended: { color: colors.primaryDark, backgroundColor: colors.primarySoft },
  name: { color: colors.text, fontSize: 18, fontWeight: '700', lineHeight: 25 },
  muted: { color: colors.muted, fontSize: 13 },
  cardBottom: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'flex-end', paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 4 },
  priceLabel: { color: colors.muted, fontSize: 12 },
  price: { color: colors.text, fontSize: 21, fontWeight: '700', marginTop: 2 },
  detailLink: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 3 },
  detailText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  pressed: { opacity: 0.7 },
  separator: { height: 12 },
  footer: { gap: 14, paddingTop: 18 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 18 },
});
