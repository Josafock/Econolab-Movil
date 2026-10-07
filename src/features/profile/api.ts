import { z } from 'zod';
import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { parseResponse } from '@/core/validation';
import { userSchema, type User } from '@/features/auth/user';
import { profileChangeSchema } from './validation';

function ownProfile(data: unknown, expectedId: string): User {
  const profile = parseResponse(userSchema, data);
  if (profile.id !== expectedId) throw new AppError('unexpected', 'El perfil recibido no corresponde a tu cuenta.');
  if (profile.rol === 'unassigned') throw new AppError('forbidden', 'Tu cuenta ya no tiene acceso. Contacta al administrador.');
  return profile;
}

export async function getProfile(expectedId: string, signal?: AbortSignal): Promise<User> {
  try {
    return ownProfile(await api.request('/users/me', { signal }), expectedId);
  } catch (error) {
    if (error instanceof AppError && error.status === 404) throw new AppError('not-found', 'No pudimos consultar tu perfil. Vuelve a intentarlo más tarde.', 404);
    throw error;
  }
}

export async function updateProfile(expectedId: string, values: { nombre: string; email: string }, currentPassword?: string, signal?: AbortSignal): Promise<User> {
  const parsed = profileChangeSchema.safeParse(values);
  if (!parsed.success) throw new AppError('validation', 'Revisa tu nombre y correo antes de guardar.');
  try {
    const response = parseResponse(z.object({ message: z.string(), usuario: userSchema }), await api.request('/users/me', {
      method: 'PATCH', body: { ...parsed.data, ...(currentPassword ? { current_password: currentPassword } : {}) }, signal, expireOnUnauthorized: false,
    }));
    return ownProfile(response.usuario, expectedId);
  } catch (error) {
    if (error instanceof AppError && error.status === 409) throw new AppError('validation', 'Ese correo ya está registrado. Utiliza otro.', 409);
    if (error instanceof AppError && error.status === 401) {
      await api.request('/studies?page=1&limit=1', { signal });
      throw new AppError('validation', 'La contraseña actual no es correcta.');
    }
    throw error;
  }
}

export async function updatePassword(currentPassword: string, password: string) {
  try {
    return parseResponse(z.object({ message: z.string() }), await api.request('/users/update-password', {
      method: 'PATCH', body: { current_password: currentPassword, password }, expireOnUnauthorized: false,
    }));
  } catch (error) {
    if (error instanceof AppError && error.status === 401) {
      // This endpoint also returns 401 for a wrong current password. Verify the
      // session with an existing read endpoint before treating it as expired.
      await api.request('/studies?page=1&limit=1');
      throw new AppError('validation', 'La contraseña actual no es correcta.');
    }
    throw error;
  }
}
