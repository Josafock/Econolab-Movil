import { ApiClient } from '@/core/api';
import { AppError, errorMessage } from '@/core/errors';

const fetchMock = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = global.fetch;

function response(status = 200, body: unknown = { ok: true }): Response {
  return { ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(body) } as unknown as Response;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

function pendingUntilAborted(_url: Parameters<typeof fetch>[0], init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    const cancel = () => { const error = new Error('Transport abort'); error.name = 'AbortError'; reject(error); };
    if (init?.signal?.aborted) cancel();
    else init?.signal?.addEventListener('abort', cancel, { once: true });
  });
}

beforeEach(() => { fetchMock.mockReset(); global.fetch = fetchMock; });
afterEach(() => jest.useRealTimers());
afterAll(() => { global.fetch = originalFetch; });

describe('authenticated HTTP transport', () => {
  function client(timeoutMs = 15000) {
    const instance = new ApiClient(() => 'https://api.example.invalid/api', timeoutMs);
    instance.setToken('fixture-token');
    return instance;
  }

  it('sends JSON and the Bearer token only through the expected headers/body', async () => {
    fetchMock.mockResolvedValue(response(201, { accepted: true }));
    await expect(client().request('/operation', { method: 'POST', body: { value: 'sample' } })).resolves.toEqual({ accepted: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.invalid/api/operation', expect.objectContaining({
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: 'Bearer fixture-token' },
      body: JSON.stringify({ value: 'sample' }),
      redirect: 'error',
    }));
  });

  it.each([
    [400, 'validation'], [401, 'unauthorized'], [403, 'forbidden'],
    [404, 'not-found'], [422, 'validation'], [429, 'server'], [500, 'server'],
  ])('maps HTTP %i to a safe %s error without displaying the backend body', async (status, kind) => {
    const serverResponse = response(status as number, { errors: [{ message: 'SQL connection with password=private-value' }] });
    fetchMock.mockResolvedValue(serverResponse);
    const error = await client().request('/studies').catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ kind, status });
    expect(errorMessage(error)).not.toMatch(/SQL|password|private-value/);
    expect(serverResponse.json).not.toHaveBeenCalled();
  });

  it('does not perform an authenticated request when the session has no token', async () => {
    const instance = new ApiClient(() => 'https://api.example.invalid/api');
    await expect(instance.request('/studies')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not attach an old token or expire a session for an anonymous login request', async () => {
    const instance = client();
    const expire = jest.fn();
    instance.setUnauthorizedHandler(expire);
    fetchMock.mockResolvedValue(response(401));
    await expect(instance.request('/auth/login', { method: 'POST', authenticated: false })).rejects.toMatchObject({ status: 401 });
    const options = fetchMock.mock.calls[0][1];
    expect(options?.headers).not.toHaveProperty('Authorization');
    expect(expire).not.toHaveBeenCalled();
  });

  it('expires only the session whose captured token received the 401', async () => {
    const instance = client();
    const expire = jest.fn();
    const pending = deferred<Response>();
    instance.setUnauthorizedHandler(expire);
    fetchMock.mockReturnValueOnce(pending.promise);
    const request = instance.request('/studies');
    instance.setToken('new-session-fixture-token');
    pending.resolve(response(401));
    await expect(request).rejects.toMatchObject({ status: 401 });
    expect(expire).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce(response(401));
    await expect(instance.request('/studies')).rejects.toMatchObject({ status: 401 });
    expect(expire).toHaveBeenCalledTimes(1);
  });

  it('supports an operation-specific 401 check without immediately expiring the session', async () => {
    const instance = client();
    const expire = jest.fn();
    instance.setUnauthorizedHandler(expire);
    fetchMock.mockResolvedValue(response(401));
    await expect(instance.request('/users/update-password', { method: 'PATCH', expireOnUnauthorized: false })).rejects.toMatchObject({ status: 401 });
    expect(expire).not.toHaveBeenCalled();
  });

  it('classifies network errors without displaying transport internals', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED internal-address:5432 password=private-value'));
    const error = await client().request('/studies').catch((reason: unknown) => reason);
    expect(error).toMatchObject({ kind: 'network' });
    expect(errorMessage(error)).not.toMatch(/ECONNREFUSED|5432|private-value/);
  });

  it('aborts timed-out requests and distinguishes them from network failures', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(pendingUntilAborted);
    const assertion = expect(client(25).request('/studies')).rejects.toMatchObject({ kind: 'timeout' });
    await jest.advanceTimersByTimeAsync(26);
    await assertion;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('honors caller cancellation and cleans up its timeout', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(pendingUntilAborted);
    const controller = new AbortController();
    const assertion = expect(client().request('/studies', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort();
    await assertion;
    expect(jest.getTimerCount()).toBe(0);
  });

  it('also honors a signal that was cancelled before the request started', async () => {
    fetchMock.mockImplementation(pendingUntilAborted);
    const controller = new AbortController();
    controller.abort();
    await expect(client().request('/studies', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('reports unreadable JSON as an invalid server response', async () => {
    const invalidResponse = response();
    invalidResponse.json = jest.fn().mockRejectedValue(new SyntaxError('private upstream details'));
    fetchMock.mockResolvedValue(invalidResponse);
    const error = await client().request('/studies').catch((reason: unknown) => reason);
    expect(error).toMatchObject({ kind: 'unexpected' });
    expect(errorMessage(error)).not.toContain('private upstream details');
  });

  it('handles an empty 204 response without trying to parse JSON', async () => {
    const empty = response(204);
    fetchMock.mockResolvedValue(empty);
    await expect(client().request('/operation')).resolves.toBeNull();
    expect(empty.json).not.toHaveBeenCalled();
  });

  it.each(['https://other.example.invalid', '//other.example.invalid'])('rejects an external path %s before sending the token', async (path) => {
    await expect(client().request(path)).rejects.toMatchObject({ kind: 'configuration' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('never displays arbitrary unknown Error messages', () => {
    expect(errorMessage(new Error('credential=secret'))).not.toContain('secret');
    expect(errorMessage({ message: 'credential=secret' })).not.toContain('secret');
  });
});
