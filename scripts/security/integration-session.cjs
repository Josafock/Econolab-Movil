const fs = require('node:fs');
const { Buffer } = require('node:buffer');
const base = process.env.INTEGRATION_API_URL?.replace(/\/$/, '');
const email = process.env.INTEGRATION_EMAIL;
const password = process.env.INTEGRATION_PASSWORD;
const valid = value => { if (!value) throw new Error('Falta configuración privada de integración.'); return value; };
const ensure = (condition, message) => { if (!condition) throw new Error(message); };

async function main() {
  const url = new URL(valid(base)); valid(email); valid(password);
  ensure(url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash, 'La integración requiere una URL HTTPS sin credenciales.');
  const cases = [];
  let session;
  const request = async (path, method = 'GET', token, body) => {
    const response = await fetch(`${base}${path}`, {
      method, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined, redirect: 'error', signal: AbortSignal.timeout(60000),
    });
    let data; try { data = await response.json(); } catch { data = null; }
    return { status: response.status, data };
  };
  const test = async (name, operation) => {
    try { await operation(); cases.push({ name, passed: true }); process.stdout.write(`OK ${name}\n`); }
    catch { cases.push({ name, passed: false }); process.stderr.write(`FALLO ${name}\n`); throw new Error('La verificación de integración no terminó correctamente.'); }
  };
  try {
    await test('Aviso público disponible y configurado', async () => {
      const result = await request('/privacy/notice'); ensure(result.status === 200 && result.data?.ready === true, 'Aviso no disponible.');
    });
    await test('Login móvil devuelve access de 15 minutos y credencial de renovación', async () => {
      const result = await request('/auth/login', 'POST', undefined, { email, password, mobile: true });
      ensure(result.status === 201 && result.data?.refreshToken && result.data?.token, 'Login móvil no disponible.');
      session = result.data;
      const claims = JSON.parse(Buffer.from(session.token.split('.')[1], 'base64url').toString('utf8'));
      ensure(claims.exp - claims.iat === 900 && String(claims.sub) === String(session.usuario.id), 'Contrato de sesión inesperado.');
    });
    await test('Perfil y preferencias propios se consultan sin modificar decisiones', async () => {
      const profile = await request('/profile', 'GET', session.token);
      ensure(profile.status === 200 && String(profile.data?.id) === String(session.usuario.id) && !profile.data.password, 'Perfil inválido.');
      const preferences = await request('/privacy/preferences', 'GET', session.token);
      ensure(preferences.status === 200 && typeof preferences.data?.optionalAnalytics === 'boolean', 'Preferencias no disponibles.');
    });
    const previous = session;
    await test('Refresh real rota la credencial y permite consultar el perfil', async () => {
      const result = await request('/auth/refresh', 'POST', undefined, { refreshToken: previous.refreshToken });
      ensure(result.status === 201 && result.data?.refreshToken !== previous.refreshToken, 'No se confirmó rotación.');
      session = result.data;
      ensure((await request('/profile', 'GET', session.token)).status === 200, 'Nueva sesión no válida.');
    });
    await test('Reutilizar refresh anterior revoca la familia de esa sesión de pruebas', async () => {
      ensure((await request('/auth/refresh', 'POST', undefined, { refreshToken: previous.refreshToken })).status === 401, 'Se aceptó una credencial consumida.');
      ensure((await request('/profile', 'GET', session.token)).status === 401, 'La familia no quedó revocada.');
    });
    await test('Logout por refresh es idempotente después de revocar', async () => {
      ensure((await request('/auth/mobile/logout', 'POST', undefined, { refreshToken: session.refreshToken })).status === 201, 'No se confirmó cierre.');
    });
  } finally {
    if (session?.refreshToken) await request('/auth/mobile/logout', 'POST', undefined, { refreshToken: session.refreshToken }).catch(() => {});
    fs.mkdirSync('reports/security', { recursive: true });
    fs.writeFileSync('reports/security/render-sessions.json', JSON.stringify({ executedAt: new Date().toISOString(), base, cases,
      scope: 'Cuenta dedicada. Solo lectura de negocio; sesiones propias creadas y revocadas. No se registró consentimiento, no se cambiaron preferencias y no se canceló ninguna cuenta.' }, null, 2));
  }
}

main().catch(() => { process.stderr.write('Integración de seguridad no aprobada; consulta los casos. No se imprimieron credenciales.\n'); process.exitCode = 1; });
