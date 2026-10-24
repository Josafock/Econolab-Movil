import { AppError } from '@/core/errors';
import type { PrivacyChanges, PrivacyNotice, PrivacyRepository } from './domain';

/** Application use case: explicit consent and destructive confirmation rules. */
export class ManagePrivacy {
  constructor(private readonly repository: PrivacyRepository) {}
  load(signal?: AbortSignal) { return Promise.all([this.repository.notice(signal), this.repository.preferences(signal)]); }
  update(notice: PrivacyNotice, accepted: boolean, values: PrivacyChanges, signal?: AbortSignal) {
    if (values.consent === true && (!accepted || !notice.ready)) throw new AppError('validation', 'Lee el aviso y marca tu aceptación para continuar.');
    return this.repository.update({ ...values, ...(values.consent === true ? { noticeVersion: notice.version } : {}) }, signal);
  }
  cancel(password: string, confirmation: string, signal?: AbortSignal) {
    if (password.length < 8 || password.length > 128 || confirmation !== 'ELIMINAR MI CUENTA') {
      throw new AppError('validation', 'Confirma tu contraseña y escribe ELIMINAR MI CUENTA exactamente.');
    }
    return this.repository.deleteAccount(password, confirmation, signal);
  }
}
