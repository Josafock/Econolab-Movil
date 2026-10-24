import { api } from '@/core/api';
import { parseResponse } from '@/core/validation';
import { studySchema, studyDetailsResponseSchema, studiesResponseSchema, studyStatusSchema, studyTypeSchema, type Study, type StudyDetail, type StudiesResponse, type StudyStatus, type StudyType } from './models';
export * from './models';

export const STUDIES_PAGE_SIZE = 20;

export function parseStudyId(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

export function buildStudiesQuery({
  page,
  search,
  type,
  status,
}: {
  page: number;
  search: string;
  type?: StudyType;
  status?: StudyStatus;
}): string {
  if (!Number.isSafeInteger(page) || page < 1) throw new Error('La página no es válida.');
  const query = new URLSearchParams({ page: String(page), limit: String(STUDIES_PAGE_SIZE) });
  if (search.trim()) query.set('search', search.trim());
  if (type) query.set('type', studyTypeSchema.parse(type));
  if (status) query.set('status', studyStatusSchema.parse(status));
  return query.toString();
}

export async function listStudies({
  signal,
  ...filters
}: {
  page: number;
  search: string;
  type?: StudyType;
  status?: StudyStatus;
  signal?: AbortSignal;
}): Promise<StudiesResponse> {
  const response = await api.request(`/studies?${buildStudiesQuery(filters)}`, { signal });
  return parseResponse(studiesResponseSchema, response);
}

export async function getStudy(id: number, signal?: AbortSignal): Promise<Study> {
  if (parseStudyId(id) === null) throw new Error('El estudio no es válido.');
  return parseResponse(studySchema, await api.request(`/studies/${id}`, { signal }));
}

export async function getStudyDetails(id: number, signal?: AbortSignal): Promise<StudyDetail[]> {
  if (parseStudyId(id) === null) throw new Error('El estudio no es válido.');
  return parseResponse(
    studyDetailsResponseSchema,
    await api.request(`/studies/${id}/details`, { signal }),
  );
}

export const studyTypeLabels: Record<StudyType, string> = {
  study: 'Estudio individual',
  package: 'Paquete',
  other: 'Otro servicio',
};

export const sampleTypeLabels: Record<Study['sampleType'], string> = {
  unknown: 'No registrada',
  blood: 'Sangre',
  serum: 'Suero',
  plasma: 'Plasma',
  urine: 'Orina',
  stool: 'Heces',
  swab: 'Hisopo',
  other: 'Otra',
};

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 2,
  }).format(price);
}
