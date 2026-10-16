import { getApiUrl } from './config';
import { AppError, httpError } from './errors';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
  expireOnUnauthorized?: boolean;
};

// Tokens are held in memory here. Persistence belongs exclusively to SecureStore.
export class ApiClient {
  private token: string | null = null;
  private onUnauthorized: (() => void) | undefined;
  constructor(private readonly baseUrl: () => string = getApiUrl, private readonly timeoutMs = 15000) {}
  setToken(token: string | null) { this.token = token; }
  setUnauthorizedHandler(handler: (() => void) | undefined) { this.onUnauthorized = handler; }

  async request(path: string, options: RequestOptions = {}): Promise<unknown> {
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) throw new AppError('configuration', 'La ruta del servicio no es válida.');
    let base: string;
    try { base = this.baseUrl(); } catch { throw new AppError('configuration', 'La conexión con ECONOLAB aún no está configurada.'); }
    const token = options.authenticated === false ? null : this.token;
    if (options.authenticated !== false && !token) throw httpError(401);
    const controller = new AbortController();
    let timedOut = false;
    const abort = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    options.signal?.addEventListener('abort', abort);
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, this.timeoutMs);
    try {
      const response = await fetch(`${base}${path}`, {
        method: options.method ?? 'GET',
        headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        redirect: 'error',
      });
      if (!response.ok) {
        if (response.status === 401 && token && token === this.token && options.expireOnUnauthorized !== false) this.onUnauthorized?.();
        // Do not surface raw backend messages: they may contain internal data.
        throw httpError(response.status);
      }
      if (response.status === 204) return null;
      try { return await response.json(); } catch {
        if (controller.signal.aborted) throw new Error('aborted');
        throw new AppError('unexpected', 'El servicio envió una respuesta que no pudimos leer.');
      }
    } catch (error) {
      if (timedOut) throw new AppError('timeout', 'La conexión tardó demasiado. Inténtalo de nuevo.');
      if (options.signal?.aborted) { const cancelled = new Error('Cancelled'); cancelled.name = 'AbortError'; throw cancelled; }
      if (error instanceof AppError) throw error;
      throw new AppError('network', 'No pudimos conectar. Revisa tu conexión a internet e inténtalo de nuevo.');
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  }
}

export const api = new ApiClient();
