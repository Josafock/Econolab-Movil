import { z } from 'zod';

import { api } from '@/core/api';
import { parseResponse } from '@/core/validation';

// PostgreSQL decimal columns arrive as strings. Do not coerce null/empty to 0.
const numericValueSchema = z
  .union([z.number(), z.string().trim().regex(/^-?\d+(?:\.\d+)?$/)])
  .transform(Number)
  .pipe(z.number().finite());
const idSchema = numericValueSchema.pipe(z.number().int().positive().safe());
const moneySchema = numericValueSchema.pipe(z.number().nonnegative());
const optionalTextSchema = z.string().nullish().transform((value) => value ?? null);

export const studyTypeSchema = z.enum(['study', 'package', 'other']);
export const studyStatusSchema = z.enum(['active', 'suspended']);
export const studySampleTypeSchema = z.enum([
  'unknown', 'blood', 'serum', 'plasma', 'urine', 'stool', 'swab', 'other',
]);

export const studySchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  code: z.string().min(1),
  description: optionalTextSchema,
  durationMinutes: numericValueSchema.pipe(z.number().int().nonnegative()),
  type: studyTypeSchema,
  normalPrice: moneySchema,
  difPrice: moneySchema,
  specialPrice: moneySchema,
  hospitalPrice: moneySchema,
  otherPrice: moneySchema,
  defaultDiscountPercent: moneySchema,
  method: optionalTextSchema,
  sampleType: studySampleTypeSchema.nullish().transform((value) => value ?? 'unknown'),
  requiresSpecialProcessing: z.boolean().nullish().transform((value) => value ?? null),
  indicator: optionalTextSchema,
  packageStudyIds: z.array(idSchema),
  status: studyStatusSchema,
  isActive: z.boolean(),
  createdAt: optionalTextSchema,
  updatedAt: optionalTextSchema,
});

export const studyDetailSchema = z.object({
  id: idSchema,
  studyId: idSchema,
  parentId: idSchema.nullish().transform((value) => value ?? null),
  dataType: z.enum(['category', 'parameter']),
  name: z.string().min(1),
  sortOrder: numericValueSchema.pipe(z.number().int()),
  unit: optionalTextSchema,
  referenceValue: optionalTextSchema,
  isActive: z.boolean(),
});

export const studiesResponseSchema = z.object({
  data: z.array(studySchema),
  meta: z.object({
    page: idSchema,
    limit: idSchema,
    total: numericValueSchema.pipe(z.number().int().nonnegative().safe()),
  }),
});
export const studyDetailsResponseSchema = z.array(studyDetailSchema);

export type Study = z.infer<typeof studySchema>;
export type StudyDetail = z.infer<typeof studyDetailSchema>;
export type StudyType = z.infer<typeof studyTypeSchema>;
export type StudyStatus = z.infer<typeof studyStatusSchema>;
export type StudiesResponse = z.infer<typeof studiesResponseSchema>;

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
