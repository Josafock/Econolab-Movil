import { getApiUrl } from './config';
import { AppError, httpError } from './errors';

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
  expireOnUnauthorized?: boolean;
  timeoutMs?: number;
  retryUnauthorized?: boolean;
};

// Tokens are held in memory here. Persistence belongs exclusively to SecureStore.
export class ApiClient {
  private token: string | null = null;
  private onUnauthorized: (() => void) | undefined;
  private onRefresh: ((expectedToken: string) => Promise<string | null>) | undefined;
  private refreshing: { token: string; promise: Promise<string | null> } | undefined;
  private readonly renewedTokens = new Map<string, string>();
  constructor(private readonly baseUrl: () => string = getApiUrl, private readonly timeoutMs = 15000, private prepare?: () => Promise<void>) {}
  setToken(token: string | null) { this.token = token; if (!token) this.renewedTokens.clear(); }
  setUnauthorizedHandler(handler: (() => void) | undefined) { this.onUnauthorized = handler; }
  setRefreshHandler(handler: ((expectedToken: string) => Promise<string | null>) | undefined) { this.onRefresh = handler; }
  setTransportPreparation(prepare: () => Promise<void>) { this.prepare = prepare; }

  private refresh(token: string) {
    if (this.refreshing?.token === token) return this.refreshing.promise;
    const promise = this.onRefresh!(token).then(next => {
      if (next && this.token === next) {
        this.renewedTokens.set(token, next);
        if (this.renewedTokens.size > 4) this.renewedTokens.delete(this.renewedTokens.keys().next().value!);
      }
      return next;
    }).finally(() => { if (this.refreshing?.promise === promise) this.refreshing = undefined; });
    this.refreshing = { token, promise };
    return promise;
  }

  private waitForRefresh(promise: Promise<string | null>, signal: AbortSignal): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const abort = () => { reject(new Error('aborted')); };
      if (signal.aborted) { abort(); return; }
      signal.addEventListener('abort', abort, { once: true });
      promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    });
  }

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
    const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? this.timeoutMs);
    try {
      if (this.prepare) await this.prepare();
      if (controller.signal.aborted) throw new Error('aborted');
      const response = await fetch(`${base}${path}`, {
        method: options.method ?? 'GET',
        headers: { Accept: 'application/json', ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
        redirect: 'error',
      });
      if (controller.signal.aborted) throw new Error('aborted');
      if (!response.ok) {
        if (response.status === 401 && token && options.expireOnUnauthorized !== false && options.retryUnauthorized !== false) {
          const replacement = token === this.token && this.onRefresh ? await this.waitForRefresh(this.refresh(token), controller.signal) : this.renewedTokens.get(token);
          if (replacement && replacement === this.token) {
            return await this.request(path, { ...options, retryUnauthorized: false, signal: controller.signal });
          }
        }
        if (response.status === 401 && token && token === this.token && options.expireOnUnauthorized !== false) this.onUnauthorized?.();
        // Do not surface raw backend messages: they may contain internal data.
        throw httpError(response.status);
      }
      if (response.status === 204) return null;
      let data: unknown;
      try { data = await response.json(); } catch {
        if (controller.signal.aborted) throw new Error('aborted');
        throw new AppError('unexpected', 'El servicio envió una respuesta que no pudimos leer.');
      }
      if (controller.signal.aborted) throw new Error('aborted');
      return data;
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

/** Singleton at the composition root; constructible instances keep tests isolated. */
export const api = new ApiClient(getApiUrl, 15000, async () => {
  throw new AppError('configuration', 'La conexión segura todavía no está preparada.');
});
