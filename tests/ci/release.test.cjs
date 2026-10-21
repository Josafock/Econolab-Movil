const test = require('node:test');
const assert = require('node:assert/strict');
const { releaseIssues } = require('../../scripts/check-release.cjs');
const app = require('../../app.json').expo;
const eas = require('../../eas.json');
const { version } = require('../../package.json');
const fixture = () => ({ app: structuredClone(app), eas: structuredClone(eas), version });

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
