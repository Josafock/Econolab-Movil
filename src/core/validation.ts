import { z } from 'zod';
import { AppError } from './errors';

export function fieldMessages(error: z.ZodError): Record<string, string> {
  const messages: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0]);
    messages[field] ??= issue.message;
  }
  return messages;
}

export function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);
  if (!result.success) throw new AppError('unexpected', 'La información recibida no tiene el formato esperado.');
  return result.data;
}
