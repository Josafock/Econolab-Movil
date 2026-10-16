import { z } from 'zod';

import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { createSession, type Session } from './session';

export const credentialsSchema = z.object({
  email: z.string().trim().email('Escribe un correo electrónico válido.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

export async function loginRequest(email: string, password: string, signal?: AbortSignal): Promise<Session> {
  const result = credentialsSchema.safeParse({ email, password });
  if (!result.success) throw new AppError('validation', 'Revisa tu correo y contraseña antes de continuar.');
  try {
    const data = await api.request('/auth/login', {
      method: 'POST', body: result.data, authenticated: false, signal,
    });
    return createSession(data);
  } catch (error) {
    if (error instanceof AppError && (error.status === 401 || error.status === 404)) {
      throw new AppError('unauthorized', 'El correo o la contraseña no son correctos.', error.status);
    }
    if (error instanceof AppError && error.status === 403) {
      throw new AppError('forbidden', 'Tu cuenta no está disponible para iniciar sesión. Contacta al administrador.', 403);
    }
    throw error;
  }
}

/** Existing authenticated endpoint; the backend does not expose a /me route. */
export async function validateSession(signal?: AbortSignal, expireOnUnauthorized = true): Promise<void> {
  await api.request('/studies?page=1&limit=1', { signal, expireOnUnauthorized });
}

export async function logoutRequest(): Promise<void> {
  await api.request('/auth/logout', { method: 'POST', expireOnUnauthorized: false });
}
