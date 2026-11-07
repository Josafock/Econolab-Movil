import type { Study, StudyDetail, StudiesResponse, StudyStatus, StudyType } from './models';

export type StudyFilters = { page: number; search: string; type?: StudyType; status?: StudyStatus };
export interface StudyRepository {
  list(filters: StudyFilters, signal?: AbortSignal): Promise<StudiesResponse>;
  get(id: number, signal?: AbortSignal): Promise<Study>;
  details(id: number, signal?: AbortSignal): Promise<StudyDetail[]>;
}
