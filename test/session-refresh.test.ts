import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createSession, readSession, saveSession } from '@/features/auth/session';

jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(), WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6 }));
const user = { id: '13', nombre: 'QA', email: 'qa@example.test', rol: 'recepcionista' as const };
const refreshToken = `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.${'a'.repeat(43)}`;
function data(exp = Math.floor(Date.now() / 1000) + 900) {
  return {
    token: `e30.${Buffer.from(JSON.stringify({ sub: user.id, nombre: user.nombre, email: user.email, rol: user.rol, exp })).toString('base64url')}.fixture`,
    usuario: user, refreshToken, refreshExpiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
}
beforeEach(() => { jest.replaceProperty(Platform, 'OS', 'android'); });
afterEach(() => jest.restoreAllMocks());

it('persists the rotating credential only in device-only SecureStore without a password', async () => {
  await saveSession(createSession(data()));
  const call = jest.mocked(SecureStore.setItemAsync).mock.calls[0];
  const stored = JSON.parse(call[1]);
  expect(stored.refreshToken).toBe(refreshToken); expect(stored).not.toHaveProperty('password');
  expect(call[2]).toEqual({ keychainAccessible: 6 });
});

it('restores an expired access token only as a candidate with an unexpired refresh credential', async () => {
  const expired = data(Math.floor(Date.now() / 1000) - 1);
  expect(() => createSession(expired)).toThrow();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify(expired));
  await expect(readSession()).resolves.toMatchObject({ refreshToken });
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(JSON.stringify({ ...expired, refreshExpiresAt: new Date(1).toISOString() }));
  await expect(readSession()).rejects.toMatchObject({ kind: 'unauthorized' });
});
