export type PrivacyNotice = {
  version: string; ready: boolean; controller: string | null; supportEmail: string | null;
  title: string; purposes: string[]; accountData: string[]; optionalPurposes: string;
  cancellation: string; retention: string;
};
export type PrivacyPreferences = {
  noticeVersion: string | null; acceptedAt: string | null;
  optionalCommunications: boolean; optionalAnalytics: boolean; currentNoticeVersion: string;
};
export type PrivacyChanges = {
  consent?: boolean; noticeVersion?: string; optionalCommunications?: boolean; optionalAnalytics?: boolean;
};

/** Repository port: the application layer does not know fetch, React or storage. */
export interface PrivacyRepository {
  notice(signal?: AbortSignal): Promise<PrivacyNotice>;
  preferences(signal?: AbortSignal): Promise<PrivacyPreferences>;
  update(values: PrivacyChanges, signal?: AbortSignal): Promise<PrivacyPreferences>;
  deleteAccount(password: string, confirmation: string, signal?: AbortSignal): Promise<void>;
}
