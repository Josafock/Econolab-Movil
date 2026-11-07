const mockConstants = { executionEnvironment: 'bare', expoConfig: { android: { package: 'com.econolab.mobile' }, extra: {} } };
const mockInitialize = jest.fn().mockResolvedValue(undefined);
const mockAvailable = jest.fn().mockReturnValue(true);
jest.mock('expo-constants', () => ({ __esModule: true, default: mockConstants }));
jest.mock('react-native-ssl-public-key-pinning', () => ({ initializeSslPinning: mockInitialize, isSslPinningAvailable: mockAvailable }));
jest.mock('@/core/config', () => ({ getApiUrl: () => 'https://backend-econolab-escuela-1.onrender.com/api' }));

beforeEach(() => {
  jest.resetModules(); mockInitialize.mockReset().mockResolvedValue(undefined); mockAvailable.mockReturnValue(true);
  mockConstants.executionEnvironment = 'bare';
});

it('activates native pinning before allowing requests, with exact domain and independent CA pins', async () => {
  const { ensurePinnedTransport } = jest.requireActual<typeof import('@/core/pinning')>('@/core/pinning');
  await Promise.all([ensurePinnedTransport(), ensurePinnedTransport()]);
  expect(mockInitialize).toHaveBeenCalledTimes(1);
  const options = mockInitialize.mock.calls[0][0]['backend-econolab-escuela-1.onrender.com'];
  expect(options.includeSubdomains).toBe(false); expect(options.publicKeyHashes).toHaveLength(3);
  expect(options.expirationDate).toBeUndefined();
});

it('fails closed when the native module is missing instead of proceeding with unpinned fetch', async () => {
  mockAvailable.mockReturnValue(false);
  const { ensurePinnedTransport } = jest.requireActual<typeof import('@/core/pinning')>('@/core/pinning');
  await expect(ensurePinnedTransport()).rejects.toMatchObject({ kind: 'configuration' });
  expect(mockInitialize).not.toHaveBeenCalled();
});

it('never disables pinning or silently falls back after a native initialization failure', async () => {
  mockInitialize.mockRejectedValue(new Error('native detail'));
  const { ensurePinnedTransport } = jest.requireActual<typeof import('@/core/pinning')>('@/core/pinning');
  await expect(ensurePinnedTransport()).rejects.toMatchObject({ kind: 'configuration' });
  await expect(ensurePinnedTransport()).rejects.toMatchObject({ kind: 'configuration' });
  expect(mockInitialize).toHaveBeenCalledTimes(1);
});
