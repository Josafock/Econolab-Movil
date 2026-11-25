import { api } from '@/core/api';
import { parseResponse } from '@/core/validation';
import type { SchoolRepository } from './SchoolRepository';
import { cutSchema, workspaceSchema, type NewActivity, type NewItem } from './models';
export class HttpSchoolRepository implements SchoolRepository {
  async load(signal?: AbortSignal) { return parseResponse(workspaceSchema, await api.request('/school/workspace', { signal })); }
  async addItem(body: NewItem, signal?: AbortSignal) { return parseResponse(workspaceSchema, await api.request('/school/catalog', { method: 'POST', body, signal })); }
  async setActive(id: number, active: boolean, signal?: AbortSignal) { return parseResponse(workspaceSchema, await api.request('/school/catalog/' + id, { method: 'PATCH', body: { active }, signal })); }
  async addActivity(body: NewActivity, signal?: AbortSignal) { return parseResponse(workspaceSchema, await api.request('/school/activities', { method: 'POST', body, signal })); }
  async cancel(id: number, signal?: AbortSignal) { return parseResponse(workspaceSchema, await api.request('/school/activities/' + id, { method: 'DELETE', signal })); }
  async cut(from: string, to: string, signal?: AbortSignal) { return parseResponse(cutSchema, await api.request('/school/cuts?' + new URLSearchParams({ from, to }), { signal })); }
  async reset(signal?: AbortSignal) { return parseResponse(workspaceSchema, await api.request('/school/workspace', { method: 'DELETE', signal })); }
}
