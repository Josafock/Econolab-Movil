import { act, fireEvent, render } from '@testing-library/react-native';
import LoginScreen from '@/features/auth/LoginScreen';
import ProfileScreen from '@/features/profile/ProfileScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { updatePassword } from '@/features/profile/api';
import { AppError } from '@/core/errors';
import PasswordField from '@/ui/PasswordField';
import NotFound from '@/app/+not-found';
import { router } from 'expo-router';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/profile/api', () => ({ updatePassword: jest.fn() }));
jest.mock('@/features/profile/ProfileCard', () => () => null);
jest.mock('lucide-react-native', () => Object.fromEntries(['Info', 'ArrowRight', 'Eye', 'EyeOff', 'KeyRound', 'LockKeyhole', 'Mail', 'ShieldCheck'].map(name => [name, () => null])));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const change = jest.mocked(updatePassword);
const login = jest.fn();
beforeEach(() => {
  jest.clearAllMocks(); change.mockReset();
  jest.mocked(useAuth).mockReturnValue({ session: { token: 'test-only', expiresAt: Date.now() + 60000, usuario: { id: '13', nombre: 'QA', email: 'qa@example.test', rol: 'admin' } }, login, logout: jest.fn(), retry: jest.fn(), applyProfile: jest.fn(), status: 'authenticated' });
});

it('permite revisar la contraseña sin cambiar su contenido y bloquea el botón al guardar', () => {
  const screen = render(<PasswordField label="Nueva contraseña" value="Fixture-test8!" editable />);
  expect(screen.getByLabelText('Nueva contraseña').props.secureTextEntry).toBe(true);
  fireEvent.press(screen.getByRole('button', { name: 'Mostrar nueva contraseña' }));
  expect(screen.getByLabelText('Nueva contraseña').props.secureTextEntry).toBe(false);
  expect(screen.getByLabelText('Nueva contraseña').props.value).toBe('Fixture-test8!');
  screen.rerender(<PasswordField label="Nueva contraseña" value="Fixture-test8!" editable={false} />);
  expect(screen.getByRole('button', { name: 'Ocultar nueva contraseña' }).props.accessibilityState.disabled).toBe(true);
});

it('regresa al login desde un enlace inexistente sin intentar entrar al inicio protegido', () => {
  jest.mocked(useAuth).mockReturnValue({ session: null, status: 'anonymous', login, logout: jest.fn(), retry: jest.fn(), applyProfile: jest.fn() });
  const screen = render(<NotFound />);
  fireEvent.press(screen.getByRole('button', { name: 'Volver al inicio' }));
  expect(router.replace).toHaveBeenCalledWith('/login');
});

it('conserva la contraseña al corregir un correo inválido y la borra al enviar el acceso', async () => {
  login.mockResolvedValue(undefined);
  const screen = render(<LoginScreen />);
  fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'correo-invalido');
  fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Fixture-test8!');
  fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));
  expect(login).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Contraseña').props.value).toBe('Fixture-test8!');
  fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'qa@example.test');
  expect(screen.queryByText('Escribe un correo electrónico válido.')).toBeNull();
  await act(async () => { fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' })); });
  expect(login).toHaveBeenCalledWith('qa@example.test', 'Fixture-test8!');
  expect(screen.getByLabelText('Contraseña').props.value).toBe('');
}, 10000);

function fillPassword(screen: ReturnType<typeof render>) {
  fireEvent.changeText(screen.getByLabelText('Contraseña actual'), 'Old-fixture8!');
  fireEvent.changeText(screen.getByLabelText('Nueva contraseña'), 'New-fixture9!');
  fireEvent.changeText(screen.getByLabelText('Confirmar nueva contraseña'), 'New-fixture9!');
  fireEvent.press(screen.getByRole('button', { name: 'Actualizar contraseña' }));
}

it('prioriza la longitud de una contraseña vacía y limpia el mensaje al escribir', () => {
  const screen = render(<ProfileScreen />);
  fireEvent.press(screen.getByRole('button', { name: 'Actualizar contraseña' }));
  expect(screen.getByText('Utiliza al menos 8 caracteres.')).toBeTruthy();
  expect(screen.queryByText('Incluye mayúsculas, minúsculas, un número y un símbolo.')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Nueva contraseña'), 'New-fixture9!');
  expect(screen.queryByText('Utiliza al menos 8 caracteres.')).toBeNull();
  expect(change).not.toHaveBeenCalled();
});

it('pide confirmar el cambio y evita peticiones duplicadas; cancela al salir de la pantalla', async () => {
  let finish!: (value: { message: string }) => void;
  change.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const screen = render(<ProfileScreen />);
  fillPassword(screen);
  expect(change).not.toHaveBeenCalled();
  const confirm = screen.getByRole('button', { name: 'Actualizar' });
  fireEvent.press(confirm); fireEvent.press(confirm);
  expect(change).toHaveBeenCalledTimes(1);
  const signal = change.mock.calls[0][2]!;
  expect(signal.aborted).toBe(false);
  expect(screen.getByLabelText('Nueva contraseña').props.value).toBe('');
  screen.unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => { finish({ message: 'Actualizada' }); });
});

it('muestra un fallo al guardar y elimina el aviso anterior al corregir el formulario', async () => {
  change.mockRejectedValueOnce(new AppError('validation', 'La contraseña actual no es correcta.'));
  const screen = render(<ProfileScreen />);
  fillPassword(screen);
  fireEvent.press(screen.getByRole('button', { name: 'Actualizar' }));
  await screen.findByText('La contraseña actual no es correcta.');
  expect(screen.queryByText('Tu contraseña se actualizó correctamente.')).toBeNull();
  fireEvent.changeText(screen.getByLabelText('Contraseña actual'), 'Correct-fixture8!');
  expect(screen.queryByText('La contraseña actual no es correcta.')).toBeNull();
});
