import { jwtDecode } from 'jwt-decode';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';

import { AppError } from '@/core/errors';
import { parseResponse } from '@/core/validation';

import { identifierSchema, userSchema, type User } from './user';
export { userSchema } from './user';
export type { User } from './user';
export type Session = { token: string; usuario: User; expiresAt: number };

export const sessionDataSchema = z.object({ token: z.string().min(1), usuario: userSchema });
const claimsSchema = z.object({
  sub: identifierSchema,
  nombre: z.string().min(1),
  email: z.string().email(),
  rol: z.enum(['admin', 'recepcionista', 'unassigned']),
  exp: z.number().int().positive(),
});

export function isSessionExpired(session: Session, now = Date.now()): boolean {
  return !Number.isFinite(session.expiresAt) || session.expiresAt <= now;
}

/** Decoding only checks local consistency. The server verifies signature and revocation. */
export function createSession(data: unknown, now = Date.now()): Session {
  const { token, usuario } = parseResponse(sessionDataSchema, data);
  let decoded: unknown;
  try { decoded = jwtDecode(token); } catch {
    throw new AppError('unauthorized', 'La sesión recibida no es válida. Inicia sesión de nuevo.');
  }
  const result = claimsSchema.safeParse(decoded);
  if (!result.success) throw new AppError('unauthorized', 'La sesión recibida no es válida. Inicia sesión de nuevo.');
  const claims = result.data;
  if (claims.sub !== usuario.id || claims.nombre !== usuario.nombre || claims.email !== usuario.email || claims.rol !== usuario.rol) {
    throw new AppError('unauthorized', 'La sesión recibida no es válida. Inicia sesión de nuevo.');
  }
  if (usuario.rol === 'unassigned') throw new AppError('forbidden', 'Esta cuenta aún no tiene acceso. Contacta al administrador.');
  const session = { token, usuario, expiresAt: claims.exp * 1000 };
  if (!Number.isSafeInteger(session.expiresAt) || isSessionExpired(session, now)) {
    throw new AppError('unauthorized', 'Tu sesión expiró. Inicia sesión de nuevo.');
  }
  return session;
}

const storageKey = 'econolab.session.v1';
const storageOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

// Serialize mutations so a delayed login write cannot overtake a logout deletion.
let storageQueue: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(operation, operation);
  storageQueue = result;
  return result;
}

export function readSession(): Promise<Session | null> {
  return serialize(async () => {
    if (Platform.OS === 'web') return null;
    let raw: string | null;
    try { raw = await SecureStore.getItemAsync(storageKey, storageOptions); } catch {
      throw new AppError('storage', 'No pudimos leer tu sesión guardada. Desbloquea el dispositivo e inténtalo de nuevo.');
    }
    if (!raw) return null;
    let value: unknown;
    try { value = JSON.parse(raw); } catch {
      throw new AppError('unauthorized', 'La sesión guardada no es válida. Inicia sesión de nuevo.');
    }
    if (!sessionDataSchema.safeParse(value).success) {
      throw new AppError('unauthorized', 'La sesión guardada no es válida. Inicia sesión de nuevo.');
    }
    return createSession(value);
  });
}

export function saveSession(session: Session): Promise<void> {
  return serialize(async () => {
    const validated = createSession(session);
    if (Platform.OS === 'web') return;
    try {
      await SecureStore.setItemAsync(storageKey, JSON.stringify({ token: validated.token, usuario: validated.usuario }), storageOptions);
    } catch {
      throw new AppError('storage', 'No pudimos guardar tu sesión de forma segura. Inténtalo de nuevo.');
    }
  });
}

export function removeSession(): Promise<void> {
  return serialize(async () => {
    if (Platform.OS === 'web') return;
    try { await SecureStore.deleteItemAsync(storageKey, storageOptions); } catch {
      throw new AppError('storage', 'No pudimos eliminar la sesión guardada. El acceso sigue bloqueado; vuelve a intentarlo.');
    }
  });
}
