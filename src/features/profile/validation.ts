import { z } from 'zod';

export const passwordChangeSchema = z.object({
  current_password: z.string().min(1, 'Escribe tu contraseña actual.'),
  password: z.string().min(8, 'Utiliza al menos 8 caracteres.').max(128, 'Utiliza como máximo 128 caracteres.')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, 'Incluye mayúsculas, minúsculas, un número y un símbolo.'),
  confirmation: z.string(),
}).refine(data => data.password === data.confirmation, { path: ['confirmation'], message: 'Las contraseñas no coinciden.' });
