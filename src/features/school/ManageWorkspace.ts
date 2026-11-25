import { AppError } from '@/core/errors';
import type { SchoolRepository } from './SchoolRepository';
import { validDate, type NewActivity, type NewItem } from './models';
export class ManageWorkspace {
  constructor(private readonly repository: SchoolRepository) {}
  load(signal?: AbortSignal) { return this.repository.load(signal); }
  addItem(values: NewItem, signal?: AbortSignal) {
    if (values.name.trim().length < 2 || values.name.trim().length > 80 || values.description.length > 240 || !Number.isSafeInteger(values.priceCents) || values.priceCents < 0 || values.priceCents > 10000000)
      throw new AppError('validation', 'Revisa el nombre y el importe: hasta $100,000.00.');
    return this.repository.addItem({ ...values, name: values.name.trim(), description: values.description.trim() }, signal);
  }
  setActive(id: number, active: boolean, signal?: AbortSignal) { return this.repository.setActive(id, active, signal); }
  addActivity(values: NewActivity, signal?: AbortSignal) {
    if (!validDate(values.date) || !Number.isSafeInteger(values.itemId) || values.itemId < 1 || !Number.isInteger(values.quantity) || values.quantity < 1 || values.quantity > 1000)
      throw new AppError('validation', 'Selecciona un servicio, una cantidad entre 1 y 1000 y una fecha válida.');
    return this.repository.addActivity(values, signal);
  }
  cancel(id: number, signal?: AbortSignal) { return this.repository.cancel(id, signal); }
  cut(from: string, to: string, signal?: AbortSignal) {
    if (!validDate(from) || !validDate(to) || from > to || Date.parse(to) - Date.parse(from) > 365 * 86400000)
      throw new AppError('validation', 'Escribe fechas válidas y un periodo de hasta 366 días.');
    return this.repository.cut(from, to, signal);
  }
  reset(signal?: AbortSignal) { return this.repository.reset(signal); }
}
