import { z } from 'zod';
import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { parseResponse } from '@/core/validation';
import { CASH_CUT_TIME_ZONE, isCalendarDate, validatePeriod } from './dates';

const date = z.string().refine(isCalendarDate);
const count = z.number().int().nonnegative().safe();
// Mantener los importes decimales como texto evita perder centavos en sumas grandes.
const money = z.string().regex(/^\d+\.\d{2}$/);
const amounts = z.object({ totalCount: count, serviceCount: count, cancelledCount: count,
  subtotalAmount: money, discountAmount: money, totalAmount: money, cancelledAmount: money });

export const cutResponseSchema = z.object({
  period: z.object({ fromDate: date, toDate: date, timeZone: z.literal(CASH_CUT_TIME_ZONE) }),
  accounting: z.object({ basis: z.literal('service-registration'), paymentsTracked: z.literal(false) }),
  summary: amounts,
  daily: z.array(amounts.extend({ date })).max(366),
  data: z.array(z.object({
    id: z.number().int().positive().safe(), folio: z.string().min(1), date,
    branchName: z.string().nullable(),
    status: z.enum(['pending', 'in_progress', 'delayed', 'completed', 'cancelled']),
    subtotalAmount: money, discountAmount: money, totalAmount: money,
  })).max(100),
  meta: z.object({ page: z.number().int().min(1), limit: z.number().int().min(1).max(100), total: count }),
});

export type CashCut = z.infer<typeof cutResponseSchema>;
export type CutQuery = { fromDate: string; toDate: string; branchName?: string; page?: number };

export async function getCashCut(query: CutQuery, signal?: AbortSignal): Promise<CashCut> {
  const error = validatePeriod(query.fromDate, query.toDate);
  if (error) throw new AppError('validation', error);
  const page = query.page ?? 1;
  if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) throw new AppError('validation', 'La página no es válida.');
  const branchName = query.branchName?.trim();
  if (branchName && branchName.length > 150) throw new AppError('validation', 'Revisa el nombre de la sucursal.');
  const parameters = new URLSearchParams({ fromDate: query.fromDate, toDate: query.toDate, page: String(page), limit: '20' });
  if (branchName) parameters.set('branchName', branchName);
  const result = parseResponse(cutResponseSchema, await api.request(`/cash-cuts?${parameters}`, { signal }));
  if (result.period.fromDate !== query.fromDate || result.period.toDate !== query.toDate || result.meta.page !== page || result.meta.limit !== 20
    || result.meta.total !== result.summary.totalCount || result.summary.serviceCount + result.summary.cancelledCount !== result.summary.totalCount
    || result.data.some(row => row.date < query.fromDate || row.date > query.toDate)
    || result.daily.some(row => row.date < query.fromDate || row.date > query.toDate)) {
    throw new AppError('unexpected', 'La respuesta no corresponde al corte solicitado.');
  }
  return result;
}

export function formatCutMoney(amount: string): string {
  if (!/^\d+\.\d{2}$/.test(amount)) return 'No disponible';
  const [whole, cents] = amount.split('.');
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}
