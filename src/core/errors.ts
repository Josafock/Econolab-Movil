export type ErrorKind = 'validation' | 'unauthorized' | 'forbidden' | 'not-found' | 'network' | 'timeout' | 'server' | 'unexpected' | 'configuration' | 'storage';

export class AppError extends Error {
  constructor(public readonly kind: ErrorKind, message: string, public readonly status?: number) {
    super(message);
    this.name = 'AppError';
  }
}

export function httpError(status: number): AppError {
  if (status === 400 || status === 422) return new AppError('validation', 'Revisa los datos e inténtalo de nuevo.', status);
  if (status === 401) return new AppError('unauthorized', 'Tu sesión dejó de ser válida. Inicia sesión de nuevo.', status);
  if (status === 403) return new AppError('forbidden', 'No tienes permiso para realizar esta operación.', status);
  if (status === 404) return new AppError('not-found', 'No encontramos la información solicitada.', status);
  if (status === 429) return new AppError('server', 'Hay demasiados intentos. Espera unos minutos antes de continuar.', status);
  return new AppError('server', 'El servicio no está disponible en este momento. Inténtalo más tarde.', status);
}

export function errorMessage(error: unknown): string {
  return error instanceof AppError ? error.message : 'No pudimos completar la operación. Inténtalo de nuevo.';
}

export function isCancelled(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
