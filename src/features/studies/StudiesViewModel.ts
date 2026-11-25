import { ObservableState } from '@/core/observable';
import { errorMessage, isCancelled } from '@/core/errors';
import type { Study, StudiesResponse } from './models';
import type { StudyFilters, StudyRepository } from './StudyRepository';
import { HttpStudyRepository } from './HttpStudyRepository';
import { SearchStudies } from './SearchStudies';

export type LoadMode = 'initial' | 'refresh' | 'more';
type State = {
  studies: Study[]; meta: StudiesResponse['meta'] | null; loading: LoadMode | null;
  failure: { message: string; page: number; mode: LoadMode } | null;
};

export class StudiesViewModel extends ObservableState<State> {
  private controller?: AbortController;
  private revision = 0;
  constructor(private readonly search: SearchStudies) {
    super({ studies: [], meta: null, loading: 'initial', failure: null });
  }
  async load(filters: StudyFilters, mode: LoadMode) {
    this.controller?.abort();
    const controller = this.controller = new AbortController();
    const revision = ++this.revision;
    this.publish({ ...this.getSnapshot(), ...(mode === 'initial' ? { studies: [], meta: null } : {}), loading: mode, failure: null });
    try {
      const response = await this.search.execute(filters, controller.signal);
      if (revision !== this.revision || controller.signal.aborted) return;
      this.publish({
        studies: mode === 'more' ? Array.from(new Map([...this.getSnapshot().studies, ...response.data].map(item => [item.id, item])).values()) : response.data,
        meta: response.meta, loading: null, failure: null,
      });
    } catch (error) {
      if (revision === this.revision && !controller.signal.aborted && !isCancelled(error)) {
        this.publish({ ...this.getSnapshot(), loading: null, failure: { message: errorMessage(error), page: filters.page, mode } });
      }
    }
  }
  dispose() { this.revision++; this.controller?.abort(); }
}

export function createStudiesViewModel(repository: StudyRepository = new HttpStudyRepository()) {
  return new StudiesViewModel(new SearchStudies(repository));
}
