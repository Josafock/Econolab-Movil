import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { SchoolProvider } from '@/features/school/SchoolProvider';
import { ActivitiesScreen, CatalogScreen, CutsScreen } from '@/features/school/Screens';
import type { SchoolRepository } from '@/features/school/SchoolRepository';
import type { Workspace } from '@/features/school/models';
import { useAuth } from '@/features/auth/AuthProvider';
jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('lucide-react-native', () => Object.fromEntries(['BookOpen', 'ClipboardList', 'House', 'Plus', 'RotateCcw', 'ShieldCheck', 'UserRound', 'Wallet'].map(name => [name, () => null])));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);
const initial = (): Workspace => ({ demonstration: true, catalog: [{ id: 1, name: 'Impresión de documentos', description: 'Servicio de ejemplo', priceCents: 250, active: true }], activities: [] });
function repository(): jest.Mocked<SchoolRepository> {
  const state = initial();
  return { load: jest.fn().mockResolvedValue(state),
    addItem: jest.fn().mockImplementation(async values => ({ ...state, catalog: [...state.catalog, { ...values, id: 2, active: true }] })),
    addActivity: jest.fn().mockImplementation(async values => ({ ...state, activities: [{ id: 1, itemId: values.itemId, itemName: state.catalog[0].name, quantity: values.quantity, totalCents: 250 * values.quantity, date: values.date, cancelled: false }] })),
    setActive: jest.fn(), cancel: jest.fn(), cut: jest.fn(), reset: jest.fn() };
}
beforeEach(() => {
  jest.mocked(useAuth).mockReturnValue({ status: 'authenticated', session: { token: 'fixture', expiresAt: Date.now() + 60000, usuario: { id: '1', nombre: 'Alumno', email: 'demo@example.test', rol: 'admin' } }, login: jest.fn(), logout: jest.fn(), retry: jest.fn(), applyProfile: jest.fn() });
});
it('crea un servicio, convierte centavos y conserva la búsqueda', async () => {
  const repo = repository(); const screen = render(<SchoolProvider repository={repo}><CatalogScreen /></SchoolProvider>);
  await screen.findByText('Impresión de documentos');
  fireEvent.press(screen.getByRole('button', { name: 'Agregar servicio' }));
  fireEvent.changeText(screen.getByLabelText('Nombre del servicio'), 'Encuadernado');
  fireEvent.changeText(screen.getByLabelText('Importe de ejemplo (MXN)'), '12.34');
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Guardar servicio' })); });
  expect(repo.addItem).toHaveBeenCalledWith({ name: 'Encuadernado', description: '', priceCents: 1234 }, expect.any(AbortSignal));
  await screen.findByText('Encuadernado');
  fireEvent.changeText(screen.getByLabelText('Buscar servicio'), 'encuadernado');
  expect(screen.queryByText('Impresión de documentos')).toBeNull();
});
it('registra una actividad con fecha y cantidad y muestra el importe devuelto', async () => {
  const repo = repository(); const screen = render(<SchoolProvider repository={repo}><ActivitiesScreen /></SchoolProvider>);
  await screen.findByRole('radio', { name: 'Impresión de documentos' });
  fireEvent.press(screen.getByRole('radio', { name: 'Impresión de documentos' }));
  fireEvent.changeText(screen.getByLabelText('Cantidad'), '3');
  fireEvent.changeText(screen.getByLabelText('Fecha (AAAA-MM-DD)'), '2026-11-06');
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Guardar actividad' })); });
  expect(repo.addActivity).toHaveBeenCalledWith({ itemId: 1, quantity: 3, date: '2026-11-06' }, expect.any(AbortSignal));
  await screen.findByRole('button', { name: 'Cancelar actividad 1' });
  expect(screen.getAllByText(/7\.50/).length).toBeGreaterThan(0);
});
it('el corte muestra un fallo sin presentarlo como un total válido', async () => {
  const repo = repository(); repo.cut.mockRejectedValue(new Error('fixture'));
  const screen = render(<SchoolProvider repository={repo}><CutsScreen /></SchoolProvider>);
  await waitFor(() => expect(repo.load).toHaveBeenCalled());
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Consultar resumen' })); });
  await screen.findByText('No pudimos completar la operación. Inténtalo de nuevo.');
  expect(screen.queryByText('$0.00')).toBeNull();
});
