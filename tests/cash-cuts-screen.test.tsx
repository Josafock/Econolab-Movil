import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { getCashCut, type CashCut } from '@/features/cash-cuts/api';
import { AppError } from '@/core/errors';
import CashCutsScreen from '@/features/cash-cuts/CashCutsScreen';

jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('lucide-react-native', () => Object.fromEntries(['CalendarDays', 'ChevronLeft', 'ChevronRight', 'RefreshCw', 'Wallet'].map(name => [name, () => null])));
jest.mock('@/features/cash-cuts/api', () => ({ ...jest.requireActual('@/features/cash-cuts/api'), getCashCut: jest.fn() }));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const getReport = jest.mocked(getCashCut);
const auth = jest.mocked(useAuth);
const user = { id: '13', nombre: 'QA', email: 'qa@example.invalid', rol: 'admin' };
const context = (rol: 'admin' | 'recepcionista'): ReturnType<typeof useAuth> => ({
  session: { token: 'fixture-token', expiresAt: Date.now() + 60000, usuario: { ...user, rol } },
  status: 'authenticated', login: jest.fn(), logout: jest.fn(), retry: jest.fn(), applyProfile: jest.fn(),
});
const amounts = { totalCount: 21, serviceCount: 20, cancelledCount: 1, subtotalAmount: '500.00', discountAmount: '20.00', totalAmount: '480.00', cancelledAmount: '100.00' };
const fixture = (query: { fromDate: string; toDate: string; page?: number }): CashCut => ({
  period: { ...query, timeZone: 'America/Mexico_City' }, accounting: { basis: 'service-registration', paymentsTracked: false },
  summary: amounts, daily: [{ ...amounts, date: query.fromDate }],
  data: [{ id: 1, folio: 'ECO-CORTE-QA', date: query.fromDate, branchName: null, status: 'cancelled', subtotalAmount: '100.00', discountAmount: '0.00', totalAmount: '100.00' }],
  meta: { page: query.page ?? 1, limit: 20, total: 21 },
});

beforeEach(() => {
  getReport.mockReset();
  auth.mockReturnValue(context('admin'));
  getReport.mockImplementation(async query => fixture(query));
});

it('restringe el módulo al administrador y no consulta para recepción', async () => {
  auth.mockReturnValue(context('recepcionista'));
  const screen = render(<CashCutsScreen />);
  expect(screen.getByText('Acceso restringido')).toBeTruthy();
  await act(async () => {});
  expect(getReport).not.toHaveBeenCalled();
});

it('muestra el total completo y los cancelados, con paginación del servidor', async () => {
  const screen = render(<CashCutsScreen />);
  await screen.findByLabelText('Importe neto registrado: $480.00 MXN');
  expect(screen.getByText('Excluido del importe neto')).toBeTruthy();
  expect(screen.getByText(/no confirman el efectivo recibido/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Página siguiente' }));
  await waitFor(() => expect(getReport).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.any(AbortSignal)));
  expect(await screen.findByText('Página 2 de 2 · 21 servicios')).toBeTruthy();
});

it('valida fechas, sin disparar una consulta con un día inexistente', async () => {
  const screen = render(<CashCutsScreen />);
  await screen.findByText('ECO-CORTE-QA');
  fireEvent.changeText(screen.getByLabelText('Fecha inicial (AAAA-MM-DD)'), '2026-02-30');
  fireEvent.press(screen.getByRole('button', { name: 'Consultar corte' }));
  expect(screen.getByText('Escribe fechas válidas con el formato AAAA-MM-DD.')).toBeTruthy();
  expect(getReport).toHaveBeenCalledTimes(1);
});

it('descarta la respuesta tardía del periodo anterior aunque llegue después de la nueva', async () => {
  let finish!: (value: CashCut) => void;
  getReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const screen = render(<CashCutsScreen />);
  await waitFor(() => expect(getReport).toHaveBeenCalledTimes(1));
  const originalQuery = getReport.mock.calls[0][0];
  const originalSignal = getReport.mock.calls[0][1];
  fireEvent.press(screen.getByRole('button', { name: 'Corte: Ayer' }));
  await screen.findByText('ECO-CORTE-QA');
  expect(originalSignal?.aborted).toBe(true);
  await act(async () => { finish({ ...fixture(originalQuery), data: [], summary: { ...amounts, totalAmount: '999999.00' } }); });
  expect(screen.queryByLabelText('Importe neto registrado: $999,999.00 MXN')).toBeNull();
  expect(screen.getByLabelText('Importe neto registrado: $480.00 MXN')).toBeTruthy();
});

it('permite reintentar un fallo real sin mostrar cifras ficticias', async () => {
  getReport.mockRejectedValueOnce(new AppError('network', 'Sin conexión de prueba.'));
  const screen = render(<CashCutsScreen />);
  await screen.findByText('Sin conexión de prueba.');
  expect(screen.queryByText('Importe neto registrado')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Volver a intentar' }));
  await screen.findByText('ECO-CORTE-QA');
});
