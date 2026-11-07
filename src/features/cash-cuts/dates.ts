export const CASH_CUT_TIME_ZONE = 'America/Mexico_City';

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function businessToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CASH_CUT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function shiftDate(value: string, days: number): string {
  if (!isCalendarDate(value) || !Number.isInteger(days)) throw new Error('Fecha no válida.');
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function validatePeriod(fromDate: string, toDate: string): string | null {
  if (!isCalendarDate(fromDate) || !isCalendarDate(toDate)) return 'Escribe fechas válidas con el formato AAAA-MM-DD.';
  if (fromDate > toDate) return 'La fecha inicial no puede ser posterior a la final.';
  const days = (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000;
  if (days > 365) return 'Consulta como máximo 366 días por corte.';
  return null;
}

export function formatCutDate(value: string): string {
  return isCalendarDate(value) ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : value;
}
