import { publicResources } from '@/core/public-resources';

it('no crea enlaces falsos cuando todavía faltan los datos del responsable', () => {
  expect(publicResources({})).toEqual({ privacyUrl: undefined, supportEmail: undefined });
});

it.each(['javascript:alert(1)', 'http://example.test/privacy', 'https://user:password@example.test/privacy'])('no abre una política con un esquema inseguro o credenciales: %s', privacyUrl => {
  expect(publicResources({ privacyUrl }).privacyUrl).toBeUndefined();
});

it.each(['qa@example.test?bcc=private@example.test', 'qa@example.test\r\nBcc:test@example.test', 'no-email'])('rechaza parámetros o encabezados en un correo de soporte: %s', supportEmail => {
  expect(publicResources({ supportEmail }).supportEmail).toBeUndefined();
});

it('acepta una página HTTPS y un correo válido sin añadir datos de la sesión', () => {
  expect(publicResources({ privacyUrl: ' https://example.test/privacy ', supportEmail: ' qa@example.test ' })).toEqual({ privacyUrl: 'https://example.test/privacy', supportEmail: 'qa@example.test' });
});
