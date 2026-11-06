import { ApiClient } from '@/core/api';
import { AppError } from '@/core/errors';
import { createSchoolViewModel } from '@/features/school/SchoolViewModel';
import { ManageWorkspace } from '@/features/school/ManageWorkspace';
import { amountToCents, validDate, workspaceSchema, type Workspace } from '@/features/school/models';
import type { SchoolRepository } from '@/features/school/SchoolRepository';
import { schoolPathAllowed } from '@/features/school/transport';
const workspace = (): Workspace => ({ demonstration: true, catalog: [{ id: 1, name: 'Impresión', description: 'Ejemplo', priceCents: 250, active: true }], activities: [] });
function repository(): jest.Mocked<SchoolRepository> {
  return { load: jest.fn().mockResolvedValue(workspace()), addItem: jest.fn().mockResolvedValue(workspace()), setActive: jest.fn(), addActivity: jest.fn().mockResolvedValue(workspace()), cancel: jest.fn(), cut: jest.fn(), reset: jest.fn() };
}
it('valida importes sin redondear decimales o admitir cantidades negativas', () => {
  expect(amountToCents('12.34')).toBe(1234);
  expect(amountToCents('0,01')).toBe(1);
  expect(amountToCents('100000')).toBe(10000000);
  for (const invalid of ['1.234', '-1', '', '1e3', '100000.01', '12pesos']) expect(amountToCents(invalid)).toBeNull();
});
it('valida el calendario real y rechaza respuestas de otra edición', () => {
  expect(validDate('2026-02-29')).toBe(false); expect(validDate('2028-02-29')).toBe(true);
  expect(workspaceSchema.safeParse({ data: [], meta: {} }).success).toBe(false);
  expect(workspaceSchema.safeParse({ ...workspace(), demonstration: false }).success).toBe(false);
});
it('rechaza datos incorrectos antes de consultar el repositorio', () => {
  const repo = repository(); const useCase = new ManageWorkspace(repo);
  expect(() => useCase.addItem({ name: ' ', description: '', priceCents: 1 })).toThrow(AppError);
  expect(() => useCase.addActivity({ itemId: 1, quantity: 0, date: '2026-11-06' })).toThrow(AppError);
  expect(() => useCase.addActivity({ itemId: 1, quantity: 2, date: '2026-02-30' })).toThrow(AppError);
  expect(() => useCase.cut('2026-11-06', '2026-11-05')).toThrow(AppError);
  expect(repo.addItem).not.toHaveBeenCalled(); expect(repo.addActivity).not.toHaveBeenCalled(); expect(repo.cut).not.toHaveBeenCalled();
});
it('notifica carga y resultado; la suscripción puede cancelarse', async () => {
  const vm = createSchoolViewModel(repository()); const listener = jest.fn(); const unsubscribe = vm.subscribe(listener);
  await vm.load(); expect(vm.getSnapshot()).toMatchObject({ workspace: workspace(), busy: false }); expect(listener).toHaveBeenCalledTimes(2);
  unsubscribe(); await vm.load(); expect(listener).toHaveBeenCalledTimes(2);
});
it('no muestra como cero una consulta fallida y permite reintentar', async () => {
  const repo = repository(); repo.cut.mockRejectedValueOnce(new AppError('network', 'Sin conexión'));
  repo.cut.mockResolvedValueOnce({ from: '2026-11-06', to: '2026-11-06', count: 0, cancelledCount: 0, totalCents: 0, activities: [] });
  const vm = createSchoolViewModel(repo); await vm.load(); await vm.searchCut('2026-11-06', '2026-11-06');
  expect(vm.getSnapshot()).toMatchObject({ failure: 'Sin conexión', cut: undefined, busy: false });
  await vm.searchCut('2026-11-06', '2026-11-06'); expect(vm.getSnapshot().cut?.totalCents).toBe(0);
});
it('descarta respuestas después de salir y puede volver a cargar', async () => {
  const repo = repository(); let complete!: (value: Workspace) => void;
  repo.load.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const vm = createSchoolViewModel(repo); const pending = vm.load(); vm.dispose(); complete(workspace()); await pending;
  expect(vm.getSnapshot().workspace).toBeNull(); await vm.load(); expect(vm.getSnapshot().workspace).not.toBeNull();
});
it('bloquea los endpoints retirados antes de llamar a fetch', async () => {
  const fetch = jest.fn(); global.fetch = fetch;
  const client = new ApiClient(() => 'https://example.test/api'); client.setToken('fixture-only'); client.setPathPolicy(schoolPathAllowed);
  for (const path of ['/studies?page=1', '/studies/1/details', '/patients', '/results', '/cash-cuts', '/privacy/notice', '/school/catalog/1/../studies', '/school//workspace']) {
    expect(schoolPathAllowed(path)).toBe(false); await expect(client.request(path)).rejects.toMatchObject({ kind: 'configuration' });
  }
  expect(fetch).not.toHaveBeenCalled();
  for (const path of ['/users/me', '/auth/login', '/auth/refresh', '/account', '/school/workspace', '/school/cuts?from=2026-11-06&to=2026-11-06', '/school/privacy/notice']) expect(schoolPathAllowed(path)).toBe(true);
});
