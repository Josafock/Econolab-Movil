import { z } from 'zod';

// TypeORM's serial ID is numeric at runtime although the entity declares a string.
export const identifierSchema = z.union([z.string().min(1), z.number().int().positive()]).transform(String);
export const userSchema = z.object({
  id: identifierSchema,
  nombre: z.string().min(1),
  email: z.string().email(),
  rol: z.enum(['admin', 'recepcionista', 'unassigned']),
});
export type User = z.infer<typeof userSchema>;
