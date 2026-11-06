import type { Cut, NewActivity, NewItem, Workspace } from './models';
export interface SchoolRepository {
  load(signal?: AbortSignal): Promise<Workspace>;
  addItem(values: NewItem, signal?: AbortSignal): Promise<Workspace>;
  setActive(id: number, active: boolean, signal?: AbortSignal): Promise<Workspace>;
  addActivity(values: NewActivity, signal?: AbortSignal): Promise<Workspace>;
  cancel(id: number, signal?: AbortSignal): Promise<Workspace>;
  cut(from: string, to: string, signal?: AbortSignal): Promise<Cut>;
  reset(signal?: AbortSignal): Promise<Workspace>;
}
