/* Real-backend smoke test. Never imports mocks or writes profile/catalog data. */
const { loadTypeScript } = require('./load-typescript.cjs');
const { z } = require('zod');

let phase = 'configuración';

class IntegrationFailure extends Error {}

function check(condition, message) {
  if (!condition) throw new IntegrationFailure(message);
}

function pass(message) {
  process.stdout.write(`OK: ${message}\n`);
}

async function expectStatus(operation, status, label) {
  try {
    await operation();
  } catch (error) {
    check(error && error.status === status, `No se recibió el HTTP esperado en ${label}.`);
    return;
  }
  throw new IntegrationFailure(`La operación de ${label} se permitió cuando debía rechazarse.`);
}

async function main() {
  check(typeof fetch === 'function', 'Se necesita Node.js 18 o posterior con fetch.');
  const required = ['INTEGRATION_API_URL', 'INTEGRATION_EMAIL', 'INTEGRATION_PASSWORD'];
  check(required.every((name) => typeof process.env[name] === 'string' && process.env[name].length > 0),
    'Faltan INTEGRATION_API_URL, INTEGRATION_EMAIL o INTEGRATION_PASSWORD. La integración no se omite.');

  const rawUrl = process.env.INTEGRATION_API_URL;
  let parsedUrl;
  try { parsedUrl = new URL(rawUrl); } catch { throw new IntegrationFailure('INTEGRATION_API_URL no es válida.'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
  const allowLocalHttp = process.env.INTEGRATION_ALLOW_LOCAL_HTTP === '1' && loopback;
  check(parsedUrl.protocol === 'https:' || (parsedUrl.protocol === 'http:' && allowLocalHttp),
    'Se requiere HTTPS. Para HTTP local usa una dirección loopback e INTEGRATION_ALLOW_LOCAL_HTTP=1.');
  check(parsedUrl.pathname.replace(/\/$/, '').endsWith('/api'), 'La URL de integración debe incluir el prefijo /api del backend.');

  const { validateApiUrl } = loadTypeScript('src/core/config.ts');
  let baseUrl;
  try { baseUrl = validateApiUrl(rawUrl, allowLocalHttp); } catch { throw new IntegrationFailure('La URL de integración contiene una configuración no permitida.'); }
  process.env.EXPO_PUBLIC_API_URL = baseUrl;
  global.__DEV__ = parsedUrl.protocol === 'http:' && allowLocalHttp;

  // These are the same transport and study schemas bundled in the mobile app.
  const { api } = loadTypeScript('src/core/api.ts');
  const { listStudies, getStudy, getStudyDetails } = loadTypeScript('src/features/studies/api.ts');
  const loginResponseSchema = z.object({
    token: z.string().min(1),
    usuario: z.object({
      id: z.union([z.string().min(1), z.number().int().positive()]).transform(String),
      nombre: z.string().min(1),
      email: z.string().email(),
      rol: z.enum(['admin', 'recepcionista']),
    }),
  });

  let authenticated = false;
  let revoked = false;
  api.setToken(null);
  try {
    phase = 'acceso anónimo';
    await expectStatus(() => api.request('/studies?page=1&limit=1', { authenticated: false }), 401, phase);
    pass('El backend rechaza el acceso anónimo al catálogo.');

    phase = 'inicio de sesión';
    // One valid attempt only. Never tests wrong passwords or account lockouts.
    const payload = await api.request('/auth/login', {
      method: 'POST',
      authenticated: false,
      body: { email: process.env.INTEGRATION_EMAIL, password: process.env.INTEGRATION_PASSWORD },
    });
    // Keep a returned token only in memory so malformed successful responses can
    // still be cleaned up with logout before the test exits.
    if (payload && typeof payload.token === 'string' && payload.token) {
      api.setToken(payload.token);
      authenticated = true;
    }
    const parsed = loginResponseSchema.safeParse(payload);
    check(parsed.success, 'El login real no cumple el contrato esperado.');
    const login = parsed.data;
    api.setToken(login.token);
    authenticated = true;
    if (process.env.INTEGRATION_USER_ID) {
      check(login.usuario.id === process.env.INTEGRATION_USER_ID, 'La sesión pertenece a una cuenta distinta a la configurada para pruebas.');
    }
    pass('El login devuelve una sesión válida con el contrato esperado.');

    phase = 'consulta y paginación de estudios';
    const firstPage = await listStudies({ page: 1, search: '' });
    check(firstPage.meta.page === 1, 'La página inicial del catálogo no coincide.');
    check(firstPage.data.length > 0, 'El catálogo necesita al menos un estudio para verificar búsqueda y detalle.');
    check(firstPage.data.length <= firstPage.meta.limit, 'El catálogo supera el límite declarado.');
    const secondPage = await listStudies({ page: 2, search: '' });
    check(secondPage.meta.page === 2, 'El servidor no respetó la segunda página solicitada.');
    check(secondPage.data.length <= secondPage.meta.limit, 'La segunda página supera el límite declarado.');
    pass('El catálogo autenticado y la paginación cumplen los esquemas de la app.');

    phase = 'búsqueda y filtros';
    const selected = firstPage.data[0];
    const filtered = await listStudies({ page: 1, search: selected.code, type: selected.type, status: selected.status });
    check(filtered.data.some((study) => study.id === selected.id), 'La búsqueda por clave no devuelve el estudio seleccionado.');
    check(filtered.data.every((study) => study.type === selected.type && study.status === selected.status), 'El servidor no respetó los filtros de tipo y estado.');
    pass('La búsqueda por clave y los filtros devuelven datos coherentes.');

    phase = 'detalle de estudio';
    const study = await getStudy(selected.id);
    check(study.id === selected.id, 'El detalle no corresponde al estudio solicitado.');
    const details = await getStudyDetails(selected.id);
    check(details.every((detail) => detail.studyId === selected.id), 'Hay parámetros asociados a otro estudio.');
    pass('El detalle, los precios y los parámetros cumplen los esquemas de la app.');

    phase = 'cierre de sesión';
    const logout = await api.request('/auth/logout', { method: 'POST' });
    check(logout && typeof logout.message === 'string', 'El cierre de sesión no devolvió su confirmación.');
    await expectStatus(() => api.request('/studies?page=1&limit=1'), 401, 'sesión revocada');
    revoked = true;
    pass('Cerrar sesión revoca el token y el backend rechaza su reutilización.');
    process.stdout.write('Integración real completada: 6 comprobaciones aprobadas.\n');
  } finally {
    if (authenticated && !revoked) {
      try { await api.request('/auth/logout', { method: 'POST' }); } catch { /* Best-effort cleanup; never logs secrets. */ }
    }
    api.setToken(null);
  }
}

main().catch((error) => {
  const detail = error instanceof IntegrationFailure
    ? error.message
    : 'No se pudo completar la operación. Revisa la conectividad y la configuración del entorno.';
  const status = Number.isInteger(error?.status) ? ` HTTP ${error.status}.` : '';
  process.stderr.write(`FALLO en ${phase}: ${detail}${status}\n`);
  process.exitCode = 1;
});
