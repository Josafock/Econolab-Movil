import { createStudiesViewModel } from '@/features/studies/StudiesViewModel';
import { SearchStudies } from '@/features/studies/SearchStudies';
import type { StudyRepository } from '@/features/studies/StudyRepository';
import type { Study, StudiesResponse } from '@/features/studies/models';

const item = { id: 1, name: 'Estudio QA' } as Study;
const result = (id = 1): StudiesResponse => ({ data: [{ ...item, id }], meta: { page: 1, limit: 20, total: 1 } });
function repository(): jest.Mocked<StudyRepository> {
  return { list: jest.fn().mockResolvedValue(result()), get: jest.fn(), details: jest.fn() };
}

it('applies search rules without depending on the HTTP adapter', async () => {
  const repo = repository(); const useCase = new SearchStudies(repo);
  expect(() => useCase.execute({ page: -1, search: '' })).toThrow();
  expect(() => useCase.execute({ page: 1, search: 'x'.repeat(201) })).toThrow();
  expect(repo.list).not.toHaveBeenCalled();
  await useCase.execute({ page: 1, search: '  QA  ' });
  expect(repo.list).toHaveBeenCalledWith({ page: 1, search: 'QA' }, undefined);
});

it('cancels stale searches and prevents older responses from replacing the selected filters', async () => {
  const repo = repository(); let complete!: (value: StudiesResponse) => void;
  repo.list.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const vm = createStudiesViewModel(repo);
  const first = vm.load({ page: 1, search: 'old' }, 'initial');
  await vm.load({ page: 1, search: 'new' }, 'initial');
  complete(result(99)); await first;
  expect(vm.getSnapshot().studies[0].id).toBe(1);
  expect(repo.list.mock.calls[0][1]?.aborted).toBe(true);
});

it('clears the old list for a new filter and provides an actionable retry after failure', async () => {
  const repo = repository(); const vm = createStudiesViewModel(repo);
  await vm.load({ page: 1, search: '' }, 'initial');
  repo.list.mockRejectedValueOnce(new Error('unavailable'));
  await vm.load({ page: 1, search: 'new' }, 'initial');
  expect(vm.getSnapshot()).toMatchObject({ studies: [], meta: null, loading: null, failure: { page: 1, mode: 'initial' } });
  await vm.load({ page: 1, search: 'new' }, 'initial');
  expect(vm.getSnapshot().failure).toBeNull(); expect(vm.getSnapshot().studies).toHaveLength(1);
});

it('deduplicates paginated items and stops observing disposed requests', async () => {
  const repo = repository(); const vm = createStudiesViewModel(repo);
  await vm.load({ page: 1, search: '' }, 'initial');
  repo.list.mockResolvedValueOnce({ data: [item, { ...item, id: 2 }], meta: { page: 2, limit: 20, total: 2 } });
  await vm.load({ page: 2, search: '' }, 'more');
  expect(vm.getSnapshot().studies.map(study => study.id)).toEqual([1, 2]);
  const listener = jest.fn(); vm.subscribe(listener);
  let complete!: (value: StudiesResponse) => void;
  repo.list.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const pending = vm.load({ page: 1, search: '' }, 'refresh'); vm.dispose();
  complete(result(99)); await pending;
  expect(listener).toHaveBeenCalledTimes(1); expect(vm.getSnapshot().studies[0].id).toBe(1);
});
