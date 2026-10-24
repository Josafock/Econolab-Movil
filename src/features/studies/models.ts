import { z } from 'zod';


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

