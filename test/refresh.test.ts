import { ApiClient, api } from '@/core/api';

const response = (status: number) => ({ status, ok: status === 200, json: async () => ({ ok: true }) } as Response);
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });

it('the shared client fails closed until its composition root configures transport security', async () => {
  const fetcher = jest.fn(); global.fetch = fetcher; api.setToken('fixture');
  const previous = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = 'https://example.test/api';
  try {
    await expect(api.request('/profile')).rejects.toMatchObject({ kind: 'configuration', message: 'La conexión segura todavía no está preparada.' });
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    api.setToken(null);
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previous;
  }
});

it('coalesces simultaneous 401 responses into one rotation and retries each request once', async () => {
  const client = new ApiClient(() => 'https://example.test/api');
  client.setToken('old');
  const fetcher = jest.fn().mockImplementation(async (_url: string, init: RequestInit) =>
    response((init.headers as Record<string, string>).Authorization === 'Bearer old' ? 401 : 200));
  global.fetch = fetcher;
  let complete!: (token: string) => void;
  const renew = jest.fn(() => new Promise<string>(resolve => { complete = resolve; }));
  client.setRefreshHandler(renew);
  const requests = [client.request('/a'), client.request('/b')];
  await Promise.resolve(); await Promise.resolve();
  expect(renew).toHaveBeenCalledTimes(1);
  client.setToken('new'); complete('new');
  await expect(Promise.all(requests)).resolves.toEqual([{ ok: true }, { ok: true }]);
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it('does not retry a request from an old account under a newly logged-in account', async () => {
  const client = new ApiClient(() => 'https://example.test/api'); client.setToken('account-one');
  let complete!: (value: Response) => void;
  const fetcher = jest.fn(() => new Promise<Response>(resolve => { complete = resolve; }));
  global.fetch = fetcher;
  const renew = jest.fn(); client.setRefreshHandler(renew);
  const pending = client.request('/profile');
  client.setToken(null); client.setToken('account-two'); complete(response(401));
  await expect(pending).rejects.toMatchObject({ status: 401 });
  expect(fetcher).toHaveBeenCalledTimes(1); expect(renew).not.toHaveBeenCalled();
});

it('never loops when a renewed token is also rejected', async () => {
  const client = new ApiClient(() => 'https://example.test/api'); client.setToken('old');
  const fetcher = jest.fn().mockResolvedValue(response(401)); global.fetch = fetcher;
  const expired = jest.fn(); client.setUnauthorizedHandler(expired);
  const renew = jest.fn(async () => { client.setToken('new'); return 'new'; }); client.setRefreshHandler(renew);
  await expect(client.request('/profile')).rejects.toMatchObject({ status: 401 });
  expect(renew).toHaveBeenCalledTimes(1); expect(fetcher).toHaveBeenCalledTimes(2); expect(expired).toHaveBeenCalledTimes(1);
});

it('does not renew a password-confirmation 401 or a request explicitly excluded', async () => {
  const client = new ApiClient(() => 'https://example.test/api'); client.setToken('old');
  global.fetch = jest.fn().mockResolvedValue(response(401));
  const renew = jest.fn(); client.setRefreshHandler(renew);
  await expect(client.request('/account', { method: 'DELETE', expireOnUnauthorized: false })).rejects.toMatchObject({ status: 401 });
  expect(renew).not.toHaveBeenCalled();
});

it('propagates a temporary refresh failure without exposing credentials or retrying the mutation', async () => {
  const client = new ApiClient(() => 'https://example.test/api'); client.setToken('old');
  const fetcher = jest.fn().mockResolvedValue(response(401)); global.fetch = fetcher;
  client.setRefreshHandler(async () => { throw new Error('transport-private-detail'); });
  await expect(client.request('/profile')).rejects.toMatchObject({ kind: 'network' });
  expect(fetcher).toHaveBeenCalledTimes(1);
});
