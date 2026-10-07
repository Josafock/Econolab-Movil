import { z } from 'zod';
import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { parseResponse } from '@/core/validation';

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
