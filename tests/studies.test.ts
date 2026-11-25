import { api } from '@/core/api';
import {
  buildStudiesQuery,
  getStudy,
  getStudyDetails,
  listStudies,
  parseStudyId,
  studiesResponseSchema,
  studySchema,
} from '@/features/studies/api';

jest.mock('@/core/api', () => ({ api: { request: jest.fn() } }));

const request = jest.mocked(api.request);

// Fixtures represent the TypeORM wire format; they are never imported by the app.
const wireStudy = {
  id: 17,
  name: 'Biometría hemática',
  code: 'EST-017',
  description: null,
  durationMinutes: 60,
  type: 'study',
  normalPrice: '249.90',
  difPrice: '200.00',
  specialPrice: '210.00',
  hospitalPrice: '225.50',
  otherPrice: '0.00',
  defaultDiscountPercent: '5.00',
  method: null,
  sampleType: 'blood',
  requiresSpecialProcessing: null,
  indicator: null,
  packageStudyIds: [],
  status: 'active',
  isActive: true,
  createdAt: '2026-10-05T12:00:00.000Z',
  updatedAt: '2026-10-05T12:00:00.000Z',
};

beforeEach(() => request.mockReset());

describe('Study contract from the existing backend', () => {
  it('reads PostgreSQL decimal strings without losing cents or unknown information', () => {
    const study = studySchema.parse(wireStudy);
    expect(study.normalPrice).toBe(249.9);
    expect(study.hospitalPrice).toBe(225.5);
    expect(study.otherPrice).toBe(0);
    expect(study.description).toBeNull();
    expect(study.requiresSpecialProcessing).toBeNull();
  });

  it.each([null, undefined, '', ' ', true, 'NaN', 'Infinity', -1])(
    'rejects a missing or invalid price (%p), instead of displaying it as free',
    (price) => {
      expect(studySchema.safeParse({ ...wireStudy, normalPrice: price }).success).toBe(false);
    },
  );

  it('rejects unknown server enums without inventing a state or type', () => {
    expect(studySchema.safeParse({ ...wireStudy, status: 'unknown' }).success).toBe(false);
    expect(studySchema.safeParse({ ...wireStudy, type: 'analysis' }).success).toBe(false);
  });

  it('uses the backend page, limit and total; totalPages is not required', () => {
    const result = studiesResponseSchema.parse({
      data: [wireStudy], meta: { page: 3, limit: 20, total: 81 },
    });
    expect(result.meta).toEqual({ page: 3, limit: 20, total: 81 });
    expect(result.meta.page * result.meta.limit < result.meta.total).toBe(true);
    expect(studiesResponseSchema.safeParse({ data: [], meta: { page: 0, limit: 20, total: -1 } }).success).toBe(false);
  });

  it('encodes search and supported filters while omitting the UI-only all option', () => {
    const query = new URLSearchParams(buildStudiesQuery({
      page: 2, search: '  Perfil & glucosa  ', type: 'package', status: 'active',
    }));
    expect(query.get('search')).toBe('Perfil & glucosa');
    expect(query.get('type')).toBe('package');
    expect(query.get('status')).toBe('active');
    expect(query.get('page')).toBe('2');
    const all = new URLSearchParams(buildStudiesQuery({ page: 1, search: ' ' }));
    expect(all.has('type')).toBe(false);
    expect(all.has('status')).toBe(false);
    expect(all.has('search')).toBe(false);
    expect(Array.from(all.values())).not.toContain('all');
  });

  it.each(['17/extra', '1e2', '0', '-2', ['17'], undefined, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid route identifiers (%p) before making a request', (value) => {
      expect(parseStudyId(value)).toBeNull();
    },
  );

  it('loads a page with cancellation support through the authenticated API client', async () => {
    const controller = new AbortController();
    request.mockResolvedValue({ data: [wireStudy], meta: { page: 2, limit: 20, total: 41 } });
    const result = await listStudies({ page: 2, search: 'hemática', signal: controller.signal });
    const [path, options] = request.mock.calls[0];
    const query = new URLSearchParams(path.split('?')[1]);
    expect(path.startsWith('/studies?')).toBe(true);
    expect(query.get('page')).toBe('2');
    expect(query.get('search')).toBe('hemática');
    expect(options?.signal).toBe(controller.signal);
    expect(options?.authenticated).not.toBe(false);
    expect(result.data[0].normalPrice).toBe(249.9);
  });

  it('accepts the direct detail response, not an invented data envelope', async () => {
    request.mockResolvedValueOnce(wireStudy);
    expect((await getStudy(17)).id).toBe(17);
    expect(request).toHaveBeenCalledWith('/studies/17', { signal: undefined });
    request.mockResolvedValueOnce({ data: wireStudy });
    await expect(getStudy(17)).rejects.toThrow('La información recibida no tiene el formato esperado.');
  });

  it('reads the separate parameter endpoint and preserves inactive records for the view to filter', async () => {
    request.mockResolvedValue([
      { id: 3, studyId: 17, parentId: null, dataType: 'parameter', name: 'Hemoglobina', sortOrder: 1, unit: 'g/dL', referenceValue: null, isActive: false },
    ]);
    const parameters = await getStudyDetails(17);
    expect(request).toHaveBeenCalledWith('/studies/17/details', { signal: undefined });
    expect(parameters[0].isActive).toBe(false);
    expect(parameters[0].referenceValue).toBeNull();
  });

  it('reports invalid responses rather than returning an empty catalog', async () => {
    request.mockResolvedValue({ rows: [], message: 'unexpected backend payload' });
    await expect(listStudies({ page: 1, search: '' })).rejects.toThrow('La información recibida no tiene el formato esperado.');
  });

  it('preserves network/cancellation errors instead of replacing them with an empty catalog', async () => {
    const error = new Error('Request cancelled');
    error.name = 'AbortError';
    request.mockRejectedValue(error);
    await expect(listStudies({ page: 1, search: '' })).rejects.toBe(error);
  });
});
