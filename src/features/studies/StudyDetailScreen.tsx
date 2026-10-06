import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { errorMessage } from '@/core/errors';
import { Button, Card, colors, Feedback, Heading, Loading, Screen } from '@/ui';
import {
  formatPrice, getStudy, getStudyDetails, parseStudyId, sampleTypeLabels, studyTypeLabels,
  type Study, type StudyDetail,
} from './api';

function Information({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.information}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>{value}</Text>
    </View>
  );
}

export default function StudyDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = parseStudyId(rawId);
  const router = useRouter();
  const [study, setStudy] = useState<Study | null>(null);
  const [details, setDetails] = useState<StudyDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const sequenceRef = useRef(0);

  const load = useCallback(async (refresh = false) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const sequence = ++sequenceRef.current;
    setError(null);
    setDetailsError(null);
    if (id === null) {
      setStudy(null);
      setDetails([]);
      setError('El enlace no corresponde a un estudio válido.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(!refresh);
    setRefreshing(refresh);

    const [studyResult, detailResult] = await Promise.allSettled([
      getStudy(id, controller.signal),
      getStudyDetails(id, controller.signal),
    ]);
    if (controller.signal.aborted || sequence !== sequenceRef.current) return;

    if (studyResult.status === 'fulfilled') {
      setStudy(studyResult.value);
    } else {
      setStudy(null);
      setError(errorMessage(studyResult.reason));
    }
    if (detailResult.status === 'fulfilled') {
      setDetails(detailResult.value.filter((detail) => detail.isActive));
    } else {
      setDetails([]);
      setDetailsError(errorMessage(detailResult.reason));
    }
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (!active) return;
      setStudy(null);
      setDetails([]);
      void load();
    });
    return () => {
      active = false;
      controllerRef.current?.abort();
      sequenceRef.current += 1;
    };
  }, [load]);

  const goBack = () => router.canGoBack() ? router.back() : router.replace('/studies');

  if (loading) return <Screen><Loading /></Screen>;
  if (error || !study) {
    return (
      <Screen>
        <Heading title="Detalle del estudio" />
        <Feedback message={error ?? 'El estudio no está disponible.'} kind="error" onRetry={id ? () => void load() : undefined} />
        <Button title="Volver al catálogo" variant="secondary" onPress={goBack} />
      </Screen>
    );
  }

  const priceRows: { label: string; amount: number }[] = [
    { label: 'Normal', amount: study.normalPrice },
    { label: 'DIF', amount: study.difPrice },
    { label: 'Especial', amount: study.specialPrice },
    { label: 'Hospital', amount: study.hospitalPrice },
    { label: 'Otro', amount: study.otherPrice },
  ];
  const detailsById = new Map(details.map((detail) => [detail.id, detail]));

  return (
    <Screen scroll={false}>
      <FlatList
        data={details}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={() => void load(true)}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button title="Volver al catálogo" variant="secondary" onPress={goBack} />
            <Heading title={study.name} subtitle={`${study.code} · ${studyTypeLabels[study.type]}`} />
            {study.status === 'suspended' ? (
              <Feedback message="Este estudio está suspendido en el catálogo." kind="info" />
            ) : null}
            <Card>
              <Text style={styles.sectionTitle}>Información del estudio</Text>
              <Information label="Descripción" value={study.description?.trim() || 'Sin descripción registrada.'} />
              <Information label="Estado" value={study.status === 'active' ? 'Activo' : 'Suspendido'} />
              <Information label="Duración registrada" value={`${study.durationMinutes} minutos`} />
              <Information label="Método" value={study.method?.trim() || 'No registrado'} />
              <Information label="Muestra" value={sampleTypeLabels[study.sampleType]} />
              <Information label="Indicador" value={study.indicator?.trim() || 'No registrado'} />
              <Information
                label="Procesamiento especial"
                value={study.requiresSpecialProcessing === null ? 'No registrado' : study.requiresSpecialProcessing ? 'Sí' : 'No'}
              />
            </Card>
            <Card>
              <Text style={styles.sectionTitle}>Precios en pesos mexicanos</Text>
              {priceRows.map((price) => (
                <View key={price.label} style={styles.priceRow}>
                  <Text style={styles.value}>{price.label}</Text>
                  <Text style={styles.price}>{formatPrice(price.amount)}</Text>
                </View>
              ))}
              <Text style={styles.note}>Descuento sugerido registrado: {study.defaultDiscountPercent}%.</Text>
            </Card>
            {study.type === 'package' ? (
              <Card>
                <Text style={styles.sectionTitle}>Estudios del paquete</Text>
                <Text style={styles.note}>Abre cada estudio para consultar su información.</Text>
                {study.packageStudyIds.length === 0 ? <Text style={styles.value}>No hay estudios asociados.</Text> : (
                  <View style={styles.packageLinks}>
                    {study.packageStudyIds.map((packageId) => (
                      <Button
                        key={packageId}
                        title={`Consultar estudio #${packageId}`}
                        variant="secondary"
                        onPress={() => router.push({ pathname: '/studies/[id]', params: { id: String(packageId) } })}
                      />
                    ))}
                  </View>
                )}
              </Card>
            ) : (
              <View style={styles.parametersHeading}>
                <Text style={styles.sectionTitle}>Parámetros del estudio</Text>
                <Text style={styles.note}>Información registrada por el laboratorio.</Text>
              </View>
            )}
            {detailsError && study.type !== 'package'
              ? <Feedback message={detailsError} kind="error" onRetry={() => void load(true)} />
              : null}
          </View>
        }
        renderItem={({ item }) => (
          <Card>
            <Text style={[styles.parameterName, item.dataType === 'category' && styles.categoryName]}>{item.name}</Text>
            {item.parentId && detailsById.has(item.parentId) ? (
              <Text style={styles.note}>{detailsById.get(item.parentId)?.name}</Text>
            ) : null}
            {item.dataType === 'parameter' ? (
              <>
                <Information label="Unidad" value={item.unit?.trim() || 'No registrada'} />
                <Information label="Valor de referencia" value={item.referenceValue?.trim() || 'No registrado'} />
              </>
            ) : <Text style={styles.note}>Categoría</Text>}
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={!detailsError && study.type !== 'package'
          ? <Feedback message="Este estudio no tiene parámetros activos registrados." kind="info" />
          : null}
        ListFooterComponent={
          <View style={styles.footer}>
            <Button title="Actualizar información" variant="secondary" loading={refreshing} onPress={() => void load(true)} />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 28 },
  header: { gap: 18, paddingBottom: 14 },
  information: { gap: 4, marginTop: 14 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  value: { color: colors.text, fontSize: 15, lineHeight: 23 },
  sectionTitle: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '700' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border },
  price: { color: colors.text, fontSize: 17, fontWeight: '700' },
  note: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 8 },
  packageLinks: { gap: 10, marginTop: 16 },
  parametersHeading: { paddingTop: 4 },
  parameterName: { color: colors.text, fontSize: 16, lineHeight: 23, fontWeight: '600' },
  categoryName: { color: colors.primaryDark, fontWeight: '700' },
  separator: { height: 12 },
  footer: { paddingTop: 20 },
});
