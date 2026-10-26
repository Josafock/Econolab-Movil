import { createPrivacyViewModel } from '@/features/privacy/PrivacyViewModel';
import { ManagePrivacy } from '@/features/privacy/ManagePrivacy';
import { HttpPrivacyRepository } from '@/features/privacy/HttpPrivacyRepository';
import type { PrivacyNotice, PrivacyPreferences, PrivacyRepository } from '@/features/privacy/domain';

const notice: PrivacyNotice = {
  version: '2026-10-23', ready: true, controller: 'Responsable QA', supportEmail: 'qa@example.test',
  title: 'Aviso', purposes: ['Acceso'], accountData: ['Nombre'], optionalPurposes: 'Opcional', cancellation: 'Cuenta', retention: 'Cuenta activa',
};
const preferences: PrivacyPreferences = { noticeVersion: null, acceptedAt: null, optionalCommunications: false, optionalAnalytics: false, currentNoticeVersion: notice.version };
function repository(): jest.Mocked<PrivacyRepository> {
  return {
    notice: jest.fn().mockResolvedValue(notice), preferences: jest.fn().mockResolvedValue(preferences),
    update: jest.fn().mockImplementation(async values => ({ ...preferences, ...values, noticeVersion: notice.version, acceptedAt: new Date().toISOString() })),
    deleteAccount: jest.fn().mockResolvedValue(undefined),
  };
}

it('keeps opt-in unchecked and prevents saving consent without an explicit decision', async () => {
  const repo = repository(); const vm = createPrivacyViewModel(repo); await vm.load();
  expect(vm.getSnapshot()).toMatchObject({ accepted: false, optionalAnalytics: false, optionalCommunications: false });
  await vm.save(); expect(repo.update).not.toHaveBeenCalled();
  expect(vm.getSnapshot().error).toContain('marca tu aceptación');
});

it('persists explicit opt-in with the exact version and resets the checkbox after saving', async () => {
  const repo = repository(); const vm = createPrivacyViewModel(repo); await vm.load();
  vm.setAccepted(true); await vm.save();
  expect(repo.update).toHaveBeenCalledWith({ consent: true, noticeVersion: notice.version, optionalAnalytics: false, optionalCommunications: false }, expect.any(AbortSignal));
  expect(vm.getSnapshot().preferences?.acceptedAt).toBeTruthy(); expect(vm.getSnapshot().accepted).toBe(false);
});

it('allows opt-out after consent without falsely recording a second acceptance', async () => {
  const repo = repository(); repo.preferences.mockResolvedValue({ ...preferences, noticeVersion: notice.version, acceptedAt: '2026-10-23T10:00:00Z', optionalCommunications: true });
  const vm = createPrivacyViewModel(repo); await vm.load(); vm.setOptional('optionalCommunications', false); await vm.save();
  expect(repo.update.mock.calls[0][0]).toEqual({ optionalCommunications: false, optionalAnalytics: false });
});

it('rejects an unconfigured notice even when the checkbox is manipulated', async () => {
  const repo = repository(); const useCase = new ManagePrivacy(repo);
  expect(() => useCase.update({ ...notice, ready: false }, true, { consent: true })).toThrow();
  expect(repo.update).not.toHaveBeenCalled();
});

it('requires both password and exact destructive confirmation', async () => {
  const repo = repository(); const vm = createPrivacyViewModel(repo);
  await vm.cancel('long-test-password', 'incorrect'); expect(repo.deleteAccount).not.toHaveBeenCalled();
  await vm.cancel('long-test-password', 'ELIMINAR MI CUENTA'); expect(repo.deleteAccount).toHaveBeenCalledTimes(1);
  expect(vm.getSnapshot().deleted).toBe(true);
});

it('Observer unsubscribe and disposal prevent stale results from restoring UI', async () => {
  const repo = repository(); let complete!: (value: PrivacyNotice) => void;
  repo.notice.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  const vm = createPrivacyViewModel(repo); const listener = jest.fn(); const unsubscribe = vm.subscribe(listener);
  const pending = vm.load(); expect(listener).toHaveBeenCalledTimes(1); unsubscribe(); vm.dispose();
  complete(notice); await pending; expect(listener).toHaveBeenCalledTimes(1); expect(vm.getSnapshot().notice).toBeUndefined();
});

it('the repository rejects an invalid response instead of displaying unvalidated data', async () => {
  const request = jest.fn().mockResolvedValue({ ready: true, supportEmail: 'invalid' });
  const repo = new HttpPrivacyRepository({ request });
  await expect(repo.notice()).rejects.toMatchObject({ kind: 'unexpected' });
  expect(request).toHaveBeenCalledWith('/privacy/notice', { authenticated: false, signal: undefined });
});
