// CNG source of truth: survives EAS prebuild without committing generated projects.
module.exports = ({ config }) => {
  const qa = process.env.ECONOLAB_NATIVE_QA === '1';
  if (qa && process.env.EAS_BUILD_PROFILE === 'production') throw new Error('No se permite publicar un entorno QA.');
  const qaPin = process.env.ECONOLAB_QA_TLS_PIN;
  if (qa && !/^[A-Za-z0-9+/]{43}=$/.test(qaPin ?? '')) throw new Error('Falta el pin SHA-256 del entorno QA.');
  return ({
  ...config,
  ...(qa ? { name: 'ECONOLAB QA', extra: { ...config.extra, nativeQa: true, qaPin } } : {}),
  android: {
    ...config.android,
    ...(qa ? { package: 'com.econolab.mobile.qa' } : {}),
    allowBackup: false,
    blockedPermissions: [...new Set([
      ...(config.android?.blockedPermissions ?? []),
      'android.permission.USE_BIOMETRIC',
      'android.permission.USE_FINGERPRINT',
    ])],
  },
  plugins: [
    ...(config.plugins ?? []),
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
