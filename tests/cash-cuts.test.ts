import { api } from '@/core/api';
import { getCashCut, formatCutMoney, cutResponseSchema } from '@/features/cash-cuts/api';
import { businessToday, isCalendarDate, shiftDate, validatePeriod } from '@/features/cash-cuts/dates';

jest.mock('@/core/api', () => ({ api: { request: jest.fn() } }));
const request = jest.mocked(api.request);
const amounts = { totalCount: 2, serviceCount: 1, cancelledCount: 1, subtotalAmount: '250.10', discountAmount: '10.00', totalAmount: '240.10', cancelledAmount: '100.00' };
const report = () => ({
  period: { fromDate: '2026-10-20', toDate: '2026-10-20', timeZone: 'America/Mexico_City' },
  accounting: { basis: 'service-registration', paymentsTracked: false },
  summary: amounts, daily: [{ ...amounts, date: '2026-10-20' }], data: [], meta: { page: 1, limit: 20, total: 2 },
});
beforeEach(() => request.mockReset());

describe('Fechas del corte en Ciudad de México', () => {
  it('no cambia de día por el UTC del teléfono y distingue medianoche local', () => {
    expect(businessToday(new Date('2026-10-21T05:59:59.999Z'))).toBe('2026-10-20');
    expect(businessToday(new Date('2026-10-21T06:00:00.000Z'))).toBe('2026-10-21');
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  });
  it.each(['2026-02-29', '2026-04-31', '2026-1-01', '0000-01-01', '2026-10-20T00:00:00Z', ''])('rechaza la fecha inválida %s', value => {
    expect(isCalendarDate(value)).toBe(false);
  });
  it('valida año bisiesto y rango máximo sin admitir periodos invertidos', () => {
    expect(isCalendarDate('2024-02-29')).toBe(true);
    expect(validatePeriod('2024-01-01', '2024-12-31')).toBeNull();
    expect(validatePeriod('2024-01-01', '2025-01-01')).not.toBeNull();
    expect(validatePeriod('2026-10-21', '2026-10-20')).not.toBeNull();
  });
});

describe('Contrato real de cortes', () => {
  const query = { fromDate: '2026-10-20', toDate: '2026-10-20' };
  it('conserva centavos y separa cancelaciones sin inferir cobros ni sumar solo la página', async () => {
    request.mockResolvedValue(report());
    const cut = await getCashCut(query);
    expect(cut.summary.totalAmount).toBe('240.10');
    expect(cut.summary.cancelledAmount).toBe('100.00');
    expect(cut.accounting.paymentsTracked).toBe(false);
    expect(cut.summary.totalCount).toBe(2);
    expect(cut.data).toHaveLength(0);
  });
  it('codifica la sucursal, envía la página y permite cancelar', async () => {
    request.mockResolvedValue({ ...report(), meta: { page: 2, limit: 20, total: 2 } });
    const controller = new AbortController();
    await getCashCut({ ...query, page: 2, branchName: ' A&B ' }, controller.signal);
    expect(request).toHaveBeenCalledWith('/cash-cuts?fromDate=2026-10-20&toDate=2026-10-20&page=2&limit=20&branchName=A%26B', { signal: controller.signal });
  });
  it.each([null, undefined, '', 'NaN', '-0.01', 240.1])('no convierte un importe corrupto en cero: %p', amount => {
    expect(cutResponseSchema.safeParse({ ...report(), summary: { ...amounts, totalAmount: amount } }).success).toBe(false);
  });
  it('rechaza datos de otro periodo, cantidades inconsistentes o páginas incorrectas', async () => {
    for (const incorrect of [
      { ...report(), period: { ...report().period, toDate: '2026-10-21' } },
      { ...report(), summary: { ...amounts, totalCount: 4 } },
      { ...report(), meta: { ...report().meta, page: 3 } },
      { ...report(), daily: [{ ...amounts, date: '2026-10-19' }] },
    ]) {
      request.mockResolvedValueOnce(incorrect);
      await expect(getCashCut(query)).rejects.toMatchObject({ kind: 'unexpected' });
    }
  });
  it('rechaza los filtros inválidos antes de enviar', async () => {
    await expect(getCashCut({ ...query, page: 0 })).rejects.toMatchObject({ kind: 'validation' });
    await expect(getCashCut({ ...query, fromDate: '2026-02-30' })).rejects.toMatchObject({ kind: 'validation' });
    await expect(getCashCut({ ...query, branchName: 'x'.repeat(151) })).rejects.toMatchObject({ kind: 'validation' });
    expect(request).not.toHaveBeenCalled();
  });
  it('preserva el error de permisos del backend', async () => {
    request.mockRejectedValue({ kind: 'forbidden', status: 403 });
    await expect(getCashCut(query)).rejects.toMatchObject({ status: 403 });
  });
  it('formatea sin redondear o perder centavos de un total grande', () => {
    expect(formatCutMoney('90071992547409.91')).toBe('$90,071,992,547,409.91');
    expect(formatCutMoney('0.00')).toBe('$0.00');
  });
});
