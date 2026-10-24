import { ObservableState } from '@/core/observable';
import { errorMessage, isCancelled } from '@/core/errors';
import { ManagePrivacy } from './ManagePrivacy';
import { HttpPrivacyRepository } from './HttpPrivacyRepository';
import type { PrivacyNotice, PrivacyPreferences, PrivacyRepository } from './domain';

type PrivacyState = {
  notice?: PrivacyNotice; preferences?: PrivacyPreferences; busy: boolean;
  accepted: boolean; optionalCommunications: boolean; optionalAnalytics: boolean;
  error?: string; success?: string; deleted: boolean;
};

/** MVVM presentation state; observed through useSyncExternalStore in the view. */
export class PrivacyViewModel extends ObservableState<PrivacyState> {
  private controller?: AbortController;
  private revision = 0;
  constructor(private readonly useCase: ManagePrivacy) {
    super({ busy: false, accepted: false, optionalCommunications: false, optionalAnalytics: false, deleted: false });
  }
  setAccepted(value: boolean) { this.publish({ ...this.getSnapshot(), accepted: value, error: undefined }); }
  setOptional(key: 'optionalCommunications' | 'optionalAnalytics', value: boolean) {
    this.publish({ ...this.getSnapshot(), [key]: value, error: undefined, success: undefined });
  }
  private begin() {
    this.controller?.abort();
    this.controller = new AbortController();
    const revision = ++this.revision;
    this.publish({ ...this.getSnapshot(), busy: true, error: undefined, success: undefined });
    return { revision, signal: this.controller.signal };
  }
  async load() {
    const { revision, signal } = this.begin();
    try {
      const [notice, preferences] = await this.useCase.load(signal);
      if (revision === this.revision && !signal.aborted) this.publish({
        notice, preferences, busy: false, accepted: false, deleted: false,
        optionalCommunications: preferences.optionalCommunications, optionalAnalytics: preferences.optionalAnalytics,
      });
    } catch (error) { this.fail(error, revision, signal); }
  }
  async save() {
    const previous = this.getSnapshot();
    if (previous.busy || !previous.notice || !previous.preferences) return;
    const { revision, signal } = this.begin();
    const needsConsent = previous.preferences.noticeVersion !== previous.notice.version || !previous.preferences.acceptedAt;
    try {
      const preferences = await this.useCase.update(previous.notice, previous.accepted, {
        ...(needsConsent ? { consent: true } : {}),
        optionalCommunications: previous.optionalCommunications, optionalAnalytics: previous.optionalAnalytics,
      }, signal);
      if (revision === this.revision && !signal.aborted) this.publish({ ...this.getSnapshot(), preferences, busy: false, accepted: false, success: 'Tus decisiones de privacidad se guardaron.' });
    } catch (error) { this.fail(error, revision, signal); }
  }
  async cancel(password: string, confirmation: string) {
    if (this.getSnapshot().busy) return;
    const { revision, signal } = this.begin();
    try {
      await this.useCase.cancel(password, confirmation, signal);
      if (revision === this.revision && !signal.aborted) this.publish({ ...this.getSnapshot(), busy: false, deleted: true });
    } catch (error) { this.fail(error, revision, signal); }
  }
  private fail(error: unknown, revision: number, signal: AbortSignal) {
    if (revision === this.revision && !signal.aborted && !isCancelled(error)) this.publish({ ...this.getSnapshot(), busy: false, error: errorMessage(error) });
  }
  dispose() { this.revision++; this.controller?.abort(); }
}

/** Factory: assembles adapters and use cases; tests can supply an independent repository. */
export function createPrivacyViewModel(repository: PrivacyRepository = new HttpPrivacyRepository()) {
  return new PrivacyViewModel(new ManagePrivacy(repository));
}
