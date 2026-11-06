// CNG source of truth: survives EAS prebuild without committing generated projects.
module.exports = ({ config }) => {
  const qa = process.env.ECONOLAB_NATIVE_QA === '1';
  if (qa && process.env.EAS_BUILD_PROFILE === 'production') throw new Error('No se permite publicar un entorno QA.');
  const qaPin = process.env.ECONOLAB_QA_TLS_PIN;
  if (qa && !/^[A-Za-z0-9+/]{43}=$/.test(qaPin ?? '')) throw new Error('Falta el pin SHA-256 del entorno QA.');
  return ({
  ...config,
  name: 'Econolab Aula',
  description: 'Práctica escolar de organización de servicios genéricos y resúmenes por fecha.',
  icon: './assets/branding/aula-icon.png',
  ios: { ...config.ios, icon: './assets/branding/aula-icon.png' },
  web: { ...config.web, favicon: './assets/branding/aula-icon.png' },
  extra: { ...config.extra, schoolEdition: true },
  ...(qa ? { name: 'ECONOLAB QA', extra: { ...config.extra, schoolEdition: true, nativeQa: true, qaPin } } : {}),
  android: {
    ...config.android,
    adaptiveIcon: { backgroundColor: '#ffffff', foregroundImage: './assets/branding/aula-adaptive.png', monochromeImage: './assets/branding/aula-monochrome.png' },
    ...(qa ? { package: 'com.econolab.mobile.qa' } : {}),
    allowBackup: false,
    blockedPermissions: [...new Set([
      ...(config.android?.blockedPermissions ?? []),
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ])],
  },
  plugins: [
    ...(config.plugins ?? []).map(plugin => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen' ? [plugin[0], { ...plugin[1], image: './assets/branding/aula-icon.png' }] : plugin),
    ['expo-build-properties', {
      android: {
        enableMinifyInReleaseBuilds: true,
        enableShrinkResourcesInReleaseBuilds: true,
        usesCleartextTraffic: false,
        networkInspector: false,
        extraProguardRules: '-keepattributes Signature,*Annotation*',
      },
      ios: { networkInspector: false },
    }],
    './plugins/with-security-verification',
  ],
});
};
