import { listStudies, getStudy, getStudyDetails } from './api';
import type { StudyFilters, StudyRepository } from './StudyRepository';

/** Data adapter preserving the API's validation and existing contracts. */
export class HttpStudyRepository implements StudyRepository {
  list(filters: StudyFilters, signal?: AbortSignal) { return listStudies({ ...filters, signal }); }
  get(id: number, signal?: AbortSignal) { return getStudy(id, signal); }
  details(id: number, signal?: AbortSignal) { return getStudyDetails(id, signal); }
}
