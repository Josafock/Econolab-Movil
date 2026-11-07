import type { StudyFilters, StudyRepository } from './StudyRepository';
import { AppError } from '@/core/errors';

export class SearchStudies {
  constructor(private readonly repository: StudyRepository) {}
  execute(filters: StudyFilters, signal?: AbortSignal) {
    if (!Number.isSafeInteger(filters.page) || filters.page < 1 || filters.search.length > 200) {
      throw new AppError('validation', 'Revisa la búsqueda y la página solicitada.');
    }
    return this.repository.list({ ...filters, search: filters.search.trim() }, signal);
  }
}
