import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import PrivacyScreen from '@/features/privacy/PrivacyScreen';
import PrivacyConsentGate from '@/features/privacy/PrivacyConsentGate';
import type { PrivacyNotice, PrivacyPreferences, PrivacyRepository } from '@/features/privacy/domain';

jest.mock('lucide-react-native', () => Object.fromEntries(['Check', 'ShieldCheck', 'Trash2', 'Eye', 'EyeOff'].map(name => [name, () => null])));
jest.mock('react-native-safe-area-context', () => jest.requireActual('react-native-safe-area-context/jest/mock').default);

const mockLogout = jest.fn();
const mockRepository: jest.Mocked<PrivacyRepository> = {
  notice: jest.fn(), preferences: jest.fn(), update: jest.fn(), deleteAccount: jest.fn(),
};
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => ({
  status: 'authenticated', session: { token: 'fixture', usuario: { id: '13' } }, logout: mockLogout,
}) }));
jest.mock('@/features/privacy/HttpPrivacyRepository', () => ({ HttpPrivacyRepository: jest.fn().mockImplementation(() => mockRepository) }));
const notice: PrivacyNotice = { version: '2026-10-23', ready: true, controller: 'QA', supportEmail: 'qa@example.test', title: 'Aviso QA', purposes: ['Proteger el acceso'], accountData: ['Nombre'], optionalPurposes: 'Opcional', cancellation: 'Se elimina la cuenta de acceso.', retention: 'Mientras exista la cuenta.' };
const preferences: PrivacyPreferences = { noticeVersion: null, acceptedAt: null, optionalCommunications: false, optionalAnalytics: false, currentNoticeVersion: notice.version };
beforeEach(() => {
  mockRepository.notice.mockResolvedValue(notice); mockRepository.preferences.mockResolvedValue(preferences);
  mockRepository.update.mockResolvedValue({ ...preferences, noticeVersion: notice.version, acceptedAt: '2026-10-24T03:00:00Z' });
  mockRepository.deleteAccount.mockResolvedValue(undefined); mockLogout.mockResolvedValue(undefined);
});

it('shows an unchecked opt-in and disables saving until the user accepts', async () => {
  render(<PrivacyScreen />);
  await screen.findByText('Aviso QA');
  const checkbox = screen.getByRole('checkbox');
  expect(checkbox.props.accessibilityState.checked).toBe(false);
  expect(screen.getByRole('button', { name: 'Guardar mis decisiones' }).props.accessibilityState.disabled).toBe(true);
  fireEvent.press(checkbox);
  fireEvent.press(screen.getByRole('button', { name: 'Guardar mis decisiones' }));
  await waitFor(() => expect(mockRepository.update).toHaveBeenCalledWith(expect.objectContaining({ consent: true, noticeVersion: notice.version }), expect.any(AbortSignal)));
  await screen.findByText('Tus decisiones de privacidad se guardaron.');
});

it('keeps the working screens hidden when consent is absent and offers logout without accepting', async () => {
  render(<PrivacyConsentGate><Text>Datos privados de trabajo</Text></PrivacyConsentGate>);
  await screen.findByText('Aviso QA');
  expect(screen.queryByText('Datos privados de trabajo')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión sin aceptar' }));
  expect(mockLogout).toHaveBeenCalledTimes(1); expect(mockRepository.update).not.toHaveBeenCalled();
});

it('requires password, exact phrase and the final confirmation before cancelling the account', async () => {
  render(<PrivacyScreen />); await screen.findByText('Aviso QA');
  fireEvent.press(screen.getByRole('button', { name: 'Quiero cancelar mi cuenta' }));
  expect(screen.getByRole('button', { name: 'Cancelar mi cuenta definitivamente' }).props.accessibilityState.disabled).toBe(true);
  fireEvent.changeText(screen.getByLabelText('Contraseña actual para cancelar'), 'fixture-only-password');
  fireEvent.changeText(screen.getByLabelText('Escribe ELIMINAR MI CUENTA'), 'ELIMINAR MI CUENTA');
  fireEvent.press(screen.getByRole('button', { name: 'Cancelar mi cuenta definitivamente' }));
  expect(mockRepository.deleteAccount).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Cancelar mi cuenta' }));
  await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
  expect(mockRepository.deleteAccount).toHaveBeenCalledWith('fixture-only-password', 'ELIMINAR MI CUENTA', expect.any(AbortSignal));
});
