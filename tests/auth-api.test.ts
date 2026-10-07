import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { credentialsSchema, loginRequest, logoutRequest, validateSession } from '@/features/auth/api';

jest.mock('@/core/api', () => ({ api: { request: jest.fn() } }));
jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6 }));

it('requires a valid email and eight-character password before contacting the API', async () => {
  expect(credentialsSchema.safeParse({ email: 'invalid', password: '12345678' }).success).toBe(false);
  await expect(loginRequest('equipo@example.test', 'short')).rejects.toMatchObject({ kind: 'validation' });
  expect(api.request).not.toHaveBeenCalled();
});

it('uses the real login body and accepts numeric IDs in the response and JWT', async () => {
  const usuario = { id: 13, nombre: 'Prueba', email: 'equipo@example.test', rol: 'recepcionista' };
  const claims = { sub: 13, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, exp: Math.floor(Date.now() / 1000) + 3600 };
  const token = `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test-signature`;
  jest.mocked(api.request).mockResolvedValueOnce({ message: 'Autenticado...', token, usuario });
  const session = await loginRequest(' equipo@example.test ', 'test-only-password');
  expect(api.request).toHaveBeenCalledWith('/auth/login', {
    method: 'POST', body: { email: usuario.email, password: 'test-only-password' }, authenticated: false, signal: undefined, timeoutMs: 60000,
  });
  expect(session.usuario.id).toBe('13');
});

it.each([401, 404])('uses the same non-enumerating message for login HTTP %i', async (status) => {
  jest.mocked(api.request).mockRejectedValueOnce(new AppError('unauthorized', 'backend-sensitive-detail', status));
  await expect(loginRequest('equipo@example.test', 'test-only-password')).rejects.toMatchObject({ message: 'El correo o la contraseña no son correctos.' });
});

it('does not expose a backend reason for an unavailable account', async () => {
  jest.mocked(api.request).mockRejectedValueOnce(new AppError('forbidden', 'backend-sensitive-detail', 403));
  await expect(loginRequest('equipo@example.test', 'test-only-password')).rejects.toMatchObject({ message: 'Tu cuenta no está disponible para iniciar sesión. Contacta al administrador.' });
});

it('checks an existing protected endpoint without inventing a current-user API', async () => {
  jest.mocked(api.request).mockResolvedValueOnce({ data: [] });
  await validateSession();
  expect(api.request).toHaveBeenCalledWith('/studies?page=1&limit=1', { signal: undefined, expireOnUnauthorized: true, timeoutMs: 60000 });
});

it('sends logout with no body and handles revocation errors in the provider', async () => {
  jest.mocked(api.request).mockResolvedValueOnce({ message: 'Sesion cerrada' });
  await logoutRequest();
  expect(api.request).toHaveBeenCalledWith('/auth/logout', { method: 'POST', expireOnUnauthorized: false });
});
