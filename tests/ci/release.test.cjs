/* global __dirname */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { releaseIssues } = require('../../scripts/check-release.cjs');
const app = require('../../app.json').expo;
const eas = require('../../eas.json');
const { version } = require('../../package.json');
const fixture = () => ({ app: structuredClone(app), eas: structuredClone(eas), version });

function cloudFixture(t) {
  const base = path.resolve(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, 'econolab-release-'));
  t.after(() => {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved), base);
    assert.ok(path.basename(resolved).startsWith('econolab-release-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.copyFileSync(path.resolve(__dirname, '../../scripts/check-release.cjs'), path.join(root, 'scripts/check-release.cjs'));
  fs.writeFileSync(path.join(root, 'app.json'), JSON.stringify({ expo: app }));
  fs.writeFileSync(path.join(root, 'eas.json'), JSON.stringify(eas));
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ version }));
  for (const file of [app.icon, app.android.adaptiveIcon.foregroundImage, app.android.adaptiveIcon.monochromeImage]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'fixture');
  }
  return { root, run: () => spawnSync(process.execPath, ['scripts/check-release.cjs', '--build'], {
    cwd: root, encoding: 'utf8', env: { ...process.env, EAS_BUILD_PROFILE: 'preview' },
  }) };
}

test('la preparación local no inventa una cuenta EAS ni datos del responsable', () => {
  assert.deepEqual(releaseIssues(fixture()), []);
  const issues = releaseIssues({ ...fixture(), store: true });
  assert.ok(issues.some(issue => issue.includes('EXPO_PUBLIC_PRIVACY_URL')));
  assert.ok(issues.some(issue => issue.includes('EXPO_PUBLIC_SUPPORT_EMAIL')));
});

test('impide publicar un APK o un backend HTTP por error', () => {
  const config = fixture();
  config.eas.build.production.android.buildType = 'apk';
  config.eas.build.production.env.EXPO_PUBLIC_API_URL = 'http://localhost:3101/api';
  const issues = releaseIssues(config);
  assert.ok(issues.some(issue => issue.includes('AAB')));
  assert.ok(issues.some(issue => issue.includes('HTTPS')));
});

test('bloquea enlaces privados, falta de projectId y repetición del versionCode en producción', () => {
  const config = fixture();
  config.eas.build.production.autoIncrement = false;
  delete config.app.extra;
  const issues = releaseIssues({ ...config, store: true, resources: { privacyUrl: 'https://user:secret@example.test', supportEmail: 'bad-email' } });
  assert.equal(issues.length, 4);
});

test('acepta configuración completa sin iniciar una compilación ni enviar datos a EAS', () => {
  const config = fixture();
  config.app.extra = { eas: { projectId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' } };
  assert.deepEqual(releaseIssues({ ...config, store: true, resources: { privacyUrl: 'https://example.test/privacy', supportEmail: 'qa@example.test' } }), []);
});

test('el hook real permite los directorios nativos vacíos que conserva EAS', t => {
  const cloud = cloudFixture(t);
  fs.mkdirSync(path.join(cloud.root, 'android'));
  fs.mkdirSync(path.join(cloud.root, 'ios'));
  const result = cloud.run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /verificada/);
});

test('el hook sigue rechazando credenciales privadas sin mostrar su contenido', t => {
  const cloud = cloudFixture(t);
  const secret = 'test-only-private-password';
  fs.writeFileSync(path.join(cloud.root, '.env.integration'), `INTEGRATION_PASSWORD=${secret}`);
  const result = cloud.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /archivos privados/);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(secret));
});
