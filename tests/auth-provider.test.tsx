import { renderHook, act, waitFor } from '@testing-library/react-native';
import type { PropsWithChildren } from 'react';

import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { loginRequest, logoutRequest, validateSession } from '@/features/auth/api';
import { readSession, removeSession, saveSession, type Session } from '@/features/auth/session';

jest.mock('@/core/api', () => ({ api: { setToken: jest.fn(), setUnauthorizedHandler: jest.fn() } }));
jest.mock('@/features/auth/api', () => ({ loginRequest: jest.fn(), logoutRequest: jest.fn(), validateSession: jest.fn() }));
jest.mock('@/features/auth/session', () => ({
  readSession: jest.fn(), saveSession: jest.fn(), removeSession: jest.fn(),
  isSessionExpired: (session: Session) => session.expiresAt <= Date.now(),
}));

const session: Session = {
  token: 'test-session-token',
  usuario: { id: '13', nombre: 'Prueba', email: 'equipo@example.test', rol: 'recepcionista' },
  expiresAt: Date.now() + 3_600_000,
};
const wrapper = ({ children }: PropsWithChildren) => <AuthProvider>{children}</AuthProvider>;

it('updates the current profile while preserving the signed login session', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
  const updated = { ...session.usuario, nombre: 'Nombre nuevo', email: 'nuevo@example.test' };
  act(() => { expect(result.current.applyProfile(updated, session.token)).toBe(true); });
  expect(result.current.profile).toEqual(updated);
  expect(result.current.session).toEqual(session);
  expect(saveSession).not.toHaveBeenCalled();
});

it('rejects a profile response from another account or an earlier login', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
  act(() => {
    expect(result.current.applyProfile({ ...session.usuario, id: '14' }, session.token)).toBe(false);
    expect(result.current.applyProfile(session.usuario, 'old-session-fixture')).toBe(false);
  });
  expect(result.current.profile).toBeUndefined();
});

it('cannot restore profile data after logout', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
  act(() => { result.current.applyProfile(session.usuario, session.token); });
  await act(async () => { await result.current.logout(); });
  act(() => { expect(result.current.applyProfile(session.usuario, session.token)).toBe(false); });
  expect(result.current.profile).toBeUndefined();
});

beforeEach(() => {
  jest.mocked(readSession).mockResolvedValue(null);
  jest.mocked(saveSession).mockResolvedValue(undefined);
  jest.mocked(removeSession).mockResolvedValue(undefined);
  jest.mocked(validateSession).mockResolvedValue(undefined);
  jest.mocked(logoutRequest).mockResolvedValue(undefined);
  jest.mocked(loginRequest).mockResolvedValue(session);
});

it('restores access only after the server verifies the saved session', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  let verify: (() => void) | undefined;
  jest.mocked(validateSession).mockImplementationOnce(() => new Promise<void>((resolve) => { verify = resolve; }));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(validateSession).toHaveBeenCalledTimes(1));
  expect(result.current.status).toBe('loading');
  expect(result.current.session).toBeNull();
  await act(async () => { verify?.(); });
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
});

it('blocks saved-session access offline and supports a real retry', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  jest.mocked(validateSession).mockRejectedValueOnce(new AppError('network', 'Sin conexión.'));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.session).toBeNull();
  expect(api.setToken).toHaveBeenLastCalledWith(null);
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
});

it('clears a revoked stored session and returns to login', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  jest.mocked(validateSession).mockRejectedValueOnce(new AppError('unauthorized', 'Expirada.', 401));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  expect(removeSession).toHaveBeenCalledTimes(1);
  expect(result.current.notice).toContain('sesión terminó');
});

it('does not resurrect an earlier login response after logout', async () => {
  let completeLogin: ((value: Session) => void) | undefined;
  jest.mocked(loginRequest).mockImplementationOnce(() => new Promise<Session>((resolve) => { completeLogin = resolve; }));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  let login: Promise<void> | undefined;
  act(() => { login = result.current.login('equipo@example.test', 'test-only-password'); });
  await act(async () => { await result.current.logout(); });
  await act(async () => { completeLogin?.(session); await login; });
  expect(result.current.status).toBe('anonymous');
  expect(result.current.session).toBeNull();
  expect(saveSession).not.toHaveBeenCalled();
});

it('removes the local session even when the server cannot revoke it', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  jest.mocked(logoutRequest).mockRejectedValueOnce(new AppError('network', 'Sin conexión.'));
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
  await act(async () => { await result.current.logout(); });
  expect(removeSession).toHaveBeenCalledTimes(1);
  expect(result.current.session).toBeNull();
  expect(result.current.status).toBe('anonymous');
  expect(result.current.notice).toContain('revocación quedó pendiente');
});

it('keeps access blocked when secure deletion fails and retry performs deletion', async () => {
  jest.mocked(readSession).mockResolvedValueOnce(session);
  const { result } = renderHook(useAuth, { wrapper });
  await waitFor(() => expect(result.current.status).toBe('authenticated'));
  jest.mocked(removeSession).mockRejectedValueOnce(new AppError('storage', 'No se pudo borrar.'));
  await act(async () => { await result.current.logout(); });
  expect(result.current.status).toBe('error');
  expect(result.current.session).toBeNull();
  act(() => result.current.retry());
  await waitFor(() => expect(result.current.status).toBe('anonymous'));
  expect(removeSession).toHaveBeenCalledTimes(2);
});
