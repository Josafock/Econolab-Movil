/* Solo usa Node: EAS lo ejecuta antes de instalar dependencias. */
/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

function httpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.hostname.endsWith('.localhost');
  } catch { return false; }
}

function releaseIssues({ app, eas, version, resources = {}, store = false }) {
  const issues = [];
  if (app.version !== version) issues.push('La versión de app.json y package.json debe coincidir.');
  if (!/^[a-zA-Z]\w*(\.[a-zA-Z]\w*){2,}$/.test(app.android?.package ?? '')) issues.push('Configura un identificador Android válido y definitivo.');
  for (const name of ['preview', 'production']) {
    if (!httpsUrl(eas.build?.[name]?.env?.EXPO_PUBLIC_API_URL)) issues.push(`El perfil ${name} necesita un backend HTTPS público.`);
  }
  if (eas.build?.preview?.android?.buildType !== 'apk') issues.push('El perfil preview debe generar un APK instalable.');
  if (eas.build?.production?.android?.buildType !== 'app-bundle') issues.push('Google Play necesita un AAB en production.');
  if (eas.cli?.appVersionSource !== 'remote' || eas.build?.production?.autoIncrement !== true) issues.push('Activa el incremento remoto de versionCode para las actualizaciones.');
  if (store) {
    if (!/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(app.extra?.eas?.projectId ?? '')) issues.push('Vincula tu proyecto de Expo con npx eas-cli@latest init.');
    if (!httpsUrl(resources.privacyUrl)) issues.push('Configura EXPO_PUBLIC_PRIVACY_URL con la política real y pública.');
    if (!/^[^\s@?&#%]+@[^\s@?&#%]+\.[^\s@?&#%]+$/.test(resources.supportEmail ?? '')) issues.push('Configura EXPO_PUBLIC_SUPPORT_EMAIL con un correo que atiendas.');
  }
  return issues;
}

function main() {
  const root = path.resolve(__dirname, '..');
  const build = process.argv.includes('--build');
  if (!build && fs.existsSync(path.join(root, '.env'))) process.loadEnvFile(path.join(root, '.env'));
  const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'))).expo;
  const eas = JSON.parse(fs.readFileSync(path.join(root, 'eas.json')));
  const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  const store = process.argv.includes('--store') || (build && process.env.EAS_BUILD_PROFILE === 'production');
  const issues = releaseIssues({ app, eas, version, store, resources: {
    privacyUrl: process.env.EXPO_PUBLIC_PRIVACY_URL,
    supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL,
  } });
  for (const file of [app.icon, app.android.adaptiveIcon.foregroundImage, app.android.adaptiveIcon.monochromeImage]) {
    if (!file || !fs.existsSync(path.resolve(root, file))) issues.push('Falta un recurso del icono nativo.');
  }
  if (build) {
    const privateFiles = fs.readdirSync(root).filter(file => /^\.env(\.|$)/.test(file) && !['.env.example', '.env.integration.example'].includes(file)
      || /\.(jks|keystore|p8|p12|pem|key)$/.test(file) || file === 'credentials.json' || /service[-_]account.*\.json$/i.test(file));
    if (privateFiles.length) issues.push('El paquete de EAS contiene archivos privados. Revisa .easignore antes de compilar.');
    // EAS puede conservar directorios nativos vacíos o prepararlos en el servidor.
    // Su existencia aquí no prueba que se haya incluido código nativo en el archivo.
    // La exclusión se comprueba sobre el archivo de subida, no sobre el builder.
  }
  if (issues.length) {
    process.stderr.write(`Falta completar la preparación:\n${issues.map(issue => `- ${issue}`).join('\n')}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`Configuración ${store ? 'de publicación' : 'base de APK/AAB'} verificada. No se inició ninguna compilación ni publicación.\n`);
    if (!store) process.stdout.write('Antes de Google Play ejecuta npm run release:check -- --store y completa la guía docs/PUBLICAR_GOOGLE_PLAY.md.\n');
  }
}

module.exports = { releaseIssues };
if (require.main === module) main();
