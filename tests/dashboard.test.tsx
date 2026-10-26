import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import DashboardScreen from '@/features/dashboard/DashboardScreen';
import BottomNavigation from '@/ui/BottomNavigation';
import { useAuth } from '@/features/auth/AuthProvider';

jest.mock('expo-router', () => ({ router: { navigate: jest.fn() }, usePathname: () => '/' }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('lucide-react-native', () => Object.fromEntries(['ArrowUpRight', 'FlaskConical', 'LogOut', 'ShieldCheck', 'UserRound', 'Wallet', 'House'].map(name => [name, () => null])));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const auth = jest.mocked(useAuth);
function asRole(rol: 'admin' | 'recepcionista') {
  auth.mockReturnValue({ session: { token: 'test-only', expiresAt: Date.now() + 60000, usuario: { id: '13', nombre: 'Usuario QA', email: 'qa@example.invalid', rol } }, login: jest.fn(), logout: jest.fn(), retry: jest.fn(), applyProfile: jest.fn(), status: 'authenticated' });
}

it('permite al administrador entrar a Cortes desde Inicio', () => {
  asRole('admin');
  const screen = render(<DashboardScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Consultar cortes' }));
  expect(router.navigate).toHaveBeenCalledWith('/cash-cuts');
});

it('oculta el acceso a Cortes para recepción sin ocultar estudios y perfil', () => {
  asRole('recepcionista');
  const screen = render(<DashboardScreen />);
  expect(screen.queryByRole('button', { name: 'Consultar cortes' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Consultar estudios' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Abrir mi perfil' })).toBeTruthy();
});

it('filtra también la navegación inferior por rol', () => {
  asRole('admin');
  const screen = render(<BottomNavigation />);
  expect(screen.getByRole('tab', { name: 'Cortes' })).toBeTruthy();
  asRole('recepcionista');
  screen.rerender(<BottomNavigation />);
  expect(screen.queryByRole('tab', { name: 'Cortes' })).toBeNull();
});
