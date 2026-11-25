import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import { createSession, isSessionExpired, readSession, removeSession, saveSession } from '@/features/auth/session';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
}));

const user = { id: '13', nombre: 'Usuario de prueba', email: 'equipo@example.test', rol: 'admin' as const };
const exp = () => Math.floor(Date.now() / 1000) + 3600;
const makeToken = (claims: object) => `e30.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.test-signature`;
const data = (overrides: object = {}) => ({
  token: makeToken({ sub: user.id, nombre: user.nombre, email: user.email, rol: user.rol, exp: exp(), ...overrides }),
  usuario: user,
});

beforeEach(() => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
  jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
});
afterEach(() => jest.restoreAllMocks());

it('reconstructs expiry from the JWT and keeps the returned user', () => {
  const session = createSession(data());
  expect(session.usuario).toEqual(user);
  expect(session.expiresAt).toBe(exp() * 1000);
  expect(isSessionExpired(session, session.expiresAt)).toBe(true);
});

it('normalizes serial IDs sent as numbers by TypeORM', () => {
  const input = data({ sub: 13 });
  const session = createSession({ ...input, usuario: { ...user, id: 13 } });
  expect(session.usuario.id).toBe('13');
});

it('rejects an expired session before granting access', () => {
  expect(() => createSession(data({ exp: 1 }))).toThrow('expiró');
});

it('rejects malformed tokens, missing expiry, and conflicting identities', () => {
  expect(() => createSession({ ...data(), token: 'invalid' })).toThrow('no es válida');
  expect(() => createSession(data({ exp: undefined }))).toThrow('no es válida');
  expect(() => createSession(data({ sub: 'other-user' }))).toThrow('no es válida');
});

it('never accepts or stores an unassigned account', async () => {
  const input = { ...data({ rol: 'unassigned' }), usuario: { ...user, rol: 'unassigned' as const } };
  expect(() => createSession(input)).toThrow('no tiene acceso');
  await expect(saveSession({ ...input, expiresAt: exp() * 1000 })).rejects.toMatchObject({ kind: 'forbidden' });
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});

it('persists only token and user using the device-only unlocked keychain policy', async () => {
  const session = createSession(data());
  await saveSession(session);
  const call = jest.mocked(SecureStore.setItemAsync).mock.calls[0];
  expect(JSON.parse(call[1])).toEqual({ token: session.token, usuario: user });
  expect(call[2]).toEqual({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
});

it('validates stored JSON and does not authorize corrupt records', async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValueOnce('{broken');
  await expect(readSession()).rejects.toMatchObject({ kind: 'unauthorized' });
});

it('surfaces read, write, and deletion failures instead of silently continuing', async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValueOnce(new Error('native details'));
  await expect(readSession()).rejects.toMatchObject({ kind: 'storage' });
  jest.mocked(SecureStore.setItemAsync).mockRejectedValueOnce(new Error('native details'));
  await expect(saveSession(createSession(data()))).rejects.toMatchObject({ kind: 'storage' });
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValueOnce(new Error('native details'));
  await expect(removeSession()).rejects.toMatchObject({ kind: 'storage' });
});

it('performs a queued logout deletion after an earlier in-flight login write', async () => {
  let finishWrite: (() => void) | undefined;
  jest.mocked(SecureStore.setItemAsync).mockImplementationOnce(() => new Promise<void>((resolve) => { finishWrite = resolve; }));
  const write = saveSession(createSession(data()));
  const deletion = removeSession();
  await Promise.resolve();
  await Promise.resolve();
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  finishWrite?.();
  await Promise.all([write, deletion]);
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
});

it('uses no persistent store in the web preview', async () => {
  jest.replaceProperty(Platform, 'OS', 'web');
  await saveSession(createSession(data()));
  expect(await readSession()).toBeNull();
  await removeSession();
  expect(SecureStore.getItemAsync).not.toHaveBeenCalled();
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
});
