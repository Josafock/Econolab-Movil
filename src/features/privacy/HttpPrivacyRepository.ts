import { z } from 'zod';
import { api, type ApiClient } from '@/core/api';
import { parseResponse } from '@/core/validation';
import { AppError } from '@/core/errors';
import type { PrivacyChanges, PrivacyRepository } from './domain';

const noticeSchema = z.object({
  version: z.string().min(1), ready: z.boolean(), controller: z.string().nullable(), supportEmail: z.string().email().nullable(),
  title: z.string(), purposes: z.array(z.string()), accountData: z.array(z.string()), optionalPurposes: z.string(),
  cancellation: z.string(), retention: z.string(),
});
const preferencesSchema = z.object({
  noticeVersion: z.string().nullable(), acceptedAt: z.string().datetime().nullable(),
  optionalCommunications: z.boolean(), optionalAnalytics: z.boolean(), currentNoticeVersion: z.string(),
});

export class HttpPrivacyRepository implements PrivacyRepository {
  constructor(private readonly client: Pick<ApiClient, 'request'> = api) {}
  async notice(signal?: AbortSignal) {
    return parseResponse(noticeSchema, await this.client.request('/privacy/notice', { authenticated: false, signal }));
  }
  async preferences(signal?: AbortSignal) {
    return parseResponse(preferencesSchema, await this.client.request('/privacy/preferences', { signal }));
  }
  async update(values: PrivacyChanges, signal?: AbortSignal) {
    return parseResponse(preferencesSchema, await this.client.request('/privacy/preferences', { method: 'PATCH', body: values, signal }));
  }
  async deleteAccount(currentPassword: string, confirmation: string, signal?: AbortSignal) {
    try {
      const result = parseResponse(z.object({ deleted: z.literal(true) }), await this.client.request('/account', {
        method: 'DELETE', body: { currentPassword, confirmation }, expireOnUnauthorized: false, signal,
      }));
      if (!result.deleted) throw new AppError('unexpected', 'No se confirmó la cancelación.');
    } catch (error) {
      if (error instanceof AppError && error.status === 401) throw new AppError('validation', 'No se pudo confirmar la contraseña o la sesión. Vuelve a iniciar sesión si es necesario.');
      if (error instanceof AppError && error.status === 409) throw new AppError('validation', 'Otro administrador debe quedar a cargo antes de cancelar esta cuenta.');
      throw error;
    }
  }
}
