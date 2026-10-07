import { api } from '@/core/api';
import { AppError } from '@/core/errors';
import { getProfile, updatePassword, updateProfile } from '@/features/profile/api';
import { passwordChangeSchema, profileChangeSchema } from '@/features/profile/validation';

jest.mock('@/core/api', () => ({ api: { request: jest.fn() } }));

const request = jest.mocked(api.request);
const validChange = {
  current_password: 'Old-fixture8!',
  password: 'New-fixture9!',
  confirmation: 'New-fixture9!',
};

beforeEach(() => request.mockReset());

describe('authenticated profile read and edit', () => {
  const profile = { id: '13', nombre: 'Jesús David', email: 'jesus@example.test', rol: 'admin' };
  it('reads the authenticated profile without accepting a caller-supplied account URL', async () => {
    request.mockResolvedValue({ ...profile, id: 13, password: 'private-fixture' });
    await expect(getProfile('13')).resolves.toEqual(profile);
    expect(request).toHaveBeenCalledWith('/users/me', { signal: undefined });
  });
  it('rejects a response belonging to another account', async () => {
    request.mockResolvedValue({ ...profile, id: 14 });
    await expect(getProfile('13')).rejects.toMatchObject({ kind: 'unexpected' });
  });
  it('rejects a profile whose account no longer has a role', async () => {
    request.mockResolvedValue({ ...profile, rol: 'unassigned' });
    await expect(getProfile('13')).rejects.toMatchObject({ kind: 'forbidden' });
  });
  it('normalizes editable fields and omits id, role and local metadata from the request', async () => {
    request.mockResolvedValue({ message: 'Perfil actualizado', usuario: profile });
    await expect(updateProfile('13', { nombre: ' Jesús David ', email: ' JESUS@EXAMPLE.TEST ' })).resolves.toEqual(profile);
    expect(request).toHaveBeenCalledWith('/users/me', { method: 'PATCH', body: { nombre: profile.nombre, email: profile.email }, signal: undefined, expireOnUnauthorized: false });
  });
  it('includes the password confirmation only when provided', async () => {
    request.mockResolvedValue({ message: 'Perfil actualizado', usuario: profile });
    await updateProfile('13', profile, 'fixture-password8!');
    expect(request.mock.calls[0][1]?.body).toEqual({ nombre: profile.nombre, email: profile.email, current_password: 'fixture-password8!' });
  });
  it.each([{ nombre: ' ' }, { nombre: 'A'.repeat(51) }, { nombre: '<script>' }, { email: 'invalid' }, { email: `${'a'.repeat(45)}@example.test` }])('rejects invalid input before calling the backend %p', async patch => {
    const invalid = { ...profile, ...patch };
    expect(profileChangeSchema.safeParse(invalid).success).toBe(false);
    await expect(updateProfile('13', invalid)).rejects.toMatchObject({ kind: 'validation' });
    expect(request).not.toHaveBeenCalled();
  });
  it('reports duplicate email without surfacing server details', async () => {
    request.mockRejectedValue(new AppError('server', 'private database fixture', 409));
    await expect(updateProfile('13', profile)).rejects.toMatchObject({ message: 'Ese correo ya está registrado. Utiliza otro.', status: 409 });
  });
  it('distinguishes wrong current password from an expired session', async () => {
    request.mockRejectedValueOnce(new AppError('unauthorized', 'Private server fixture', 401)).mockResolvedValueOnce({});
    await expect(updateProfile('13', profile, 'fixture8!')).rejects.toMatchObject({ kind: 'validation', message: 'La contraseña actual no es correcta.' });
    expect(request).toHaveBeenNthCalledWith(2, '/studies?page=1&limit=1', { signal: undefined });
  });
  it('propagates revocation instead of claiming a wrong password', async () => {
    const revoked = new AppError('unauthorized', 'Expired', 401);
    request.mockRejectedValueOnce(revoked).mockRejectedValueOnce(revoked);
    await expect(updateProfile('13', profile, 'fixture8!')).rejects.toBe(revoked);
  });
});

describe('profile password validation and existing API', () => {
  it('accepts matching passwords that satisfy the backend requirements', () => {
    expect(passwordChangeSchema.safeParse(validChange).success).toBe(true);
  });

  it.each(['short7!', 'onlylowercase8!', 'ONLYUPPERCASE8!', 'WithoutNumbers!', 'WithoutSymbol8', 'A'.repeat(129)])(
    'rejects a new password that fails a backend requirement (%p)', (password) => {
      expect(passwordChangeSchema.safeParse({ ...validChange, password, confirmation: password }).success).toBe(false);
    },
  );

  it('reports mismatched confirmation on the confirmation field', () => {
    const result = passwordChangeSchema.safeParse({ ...validChange, confirmation: 'Different9!' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === 'confirmation')).toBe(true);
  });

  it('requires the current password', () => {
    expect(passwordChangeSchema.safeParse({ ...validChange, current_password: '' }).success).toBe(false);
  });

  it('uses the real update-password endpoint and omits the local confirmation field', async () => {
    request.mockResolvedValue({ message: 'Contraseña actualizada' });
    await expect(updatePassword(validChange.current_password, validChange.password)).resolves.toEqual({ message: 'Contraseña actualizada' });
    expect(request).toHaveBeenCalledTimes(1);
    expect(request).toHaveBeenCalledWith('/users/update-password', {
      method: 'PATCH',
      body: { current_password: validChange.current_password, password: validChange.password },
      expireOnUnauthorized: false,
    });
  });

  it('checks whether a password-related 401 is actually a valid session before reporting wrong current password', async () => {
    request.mockRejectedValueOnce(new AppError('unauthorized', 'Unauthorized', 401));
    request.mockResolvedValueOnce({ data: [], meta: { page: 1, limit: 1, total: 0 } });
    await expect(updatePassword(validChange.current_password, validChange.password)).rejects.toMatchObject({
      kind: 'validation', message: 'La contraseña actual no es correcta.',
    });
    expect(request).toHaveBeenNthCalledWith(2, '/studies?page=1&limit=1');
  });

  it('propagates a revoked-session response from the validation request', async () => {
    const expired = new AppError('unauthorized', 'Sesión expirada', 401);
    request.mockRejectedValueOnce(new AppError('unauthorized', 'Unauthorized', 401));
    request.mockRejectedValueOnce(expired);
    await expect(updatePassword(validChange.current_password, validChange.password)).rejects.toBe(expired);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('does not claim the current password is wrong when session verification fails on the network', async () => {
    const network = new AppError('network', 'Sin conexión');
    request.mockRejectedValueOnce(new AppError('unauthorized', 'Unauthorized', 401));
    request.mockRejectedValueOnce(network);
    await expect(updatePassword(validChange.current_password, validChange.password)).rejects.toBe(network);
  });

  it('does not issue extra session probes for a forbidden operation', async () => {
    const forbidden = new AppError('forbidden', 'Sin permiso', 403);
    request.mockRejectedValueOnce(forbidden);
    await expect(updatePassword(validChange.current_password, validChange.password)).rejects.toBe(forbidden);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('does not show success for an invalid server response', async () => {
    request.mockResolvedValue({ saved: true });
    await expect(updatePassword(validChange.current_password, validChange.password)).rejects.toMatchObject({ kind: 'unexpected' });
  });
});
