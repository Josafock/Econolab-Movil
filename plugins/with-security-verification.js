const { withAppBuildGradle, withAndroidManifest, withDangerousMod } = require('expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');

module.exports = function withSecurityVerification(config) {
  const qa = config.extra?.nativeQa === true;
  config = withAppBuildGradle(config, mod => {
    mod.modResults.contents = mod.modResults.contents.replace('proguard-android.txt', 'proguard-android-optimize.txt');
    if (!mod.modResults.contents.includes('econolab-security-tests')) {
      mod.modResults.contents += '\n// econolab-security-tests\ndependencies { testImplementation("junit:junit:4.13.2") }\n';
    }
    return mod;
  });
  if (qa) config = withAndroidManifest(config, mod => {
    mod.modResults.manifest.application[0].$['android:networkSecurityConfig'] = '@xml/econolab_qa_network_security';
    return mod;
  });
  return withDangerousMod(config, ['android', async mod => {
    const root = mod.modRequest.projectRoot;
    const android = mod.modRequest.platformProjectRoot;
    const out = path.join(android, 'app/src/test/java/com/econolab/security');
    fs.mkdirSync(out, { recursive: true });
    fs.copyFileSync(path.join(root, 'native-tests/PinningTest.java'), path.join(out, 'PinningTest.java'));
    const pins = require('../config/pinning.json');
    fs.writeFileSync(path.join(out, 'ProductionPins.java'), `package com.econolab.security;\nfinal class ProductionPins {\n static final String HOST = ${JSON.stringify(pins.hostname)};\n static final String[] PINS = new String[] {${pins.publicKeyHashes.map(pin => JSON.stringify(`sha256/${pin}`)).join(',')}};\n}\n`);
    if (qa) {
      const cert = process.env.ECONOLAB_QA_CA_FILE;
      if (!cert || !fs.existsSync(cert)) throw new Error('Falta el certificado público del entorno nativo QA.');
      const res = path.join(android, 'app/src/main/res');
      fs.mkdirSync(path.join(res, 'raw'), { recursive: true });
      fs.mkdirSync(path.join(res, 'xml'), { recursive: true });
      fs.copyFileSync(cert, path.join(res, 'raw/econolab_qa_ca.pem'));
      fs.writeFileSync(path.join(res, 'xml/econolab_qa_network_security.xml'), '<?xml version="1.0" encoding="utf-8"?><network-security-config><base-config cleartextTrafficPermitted="false"><trust-anchors><certificates src="system" /></trust-anchors></base-config><domain-config cleartextTrafficPermitted="false"><domain includeSubdomains="false">10.0.2.2</domain><trust-anchors><certificates src="@raw/econolab_qa_ca" /></trust-anchors></domain-config></network-security-config>');
      // Metro uses HTTP only in the QA Debug variant. Release keeps the strict
      // main resource above; the production package never receives this overlay.
      const debugXml = path.join(android, 'app/src/debug/res/xml');
      fs.mkdirSync(debugXml, { recursive: true });
      fs.writeFileSync(path.join(debugXml, 'econolab_qa_network_security.xml'), '<?xml version="1.0" encoding="utf-8"?><network-security-config><base-config cleartextTrafficPermitted="false"><trust-anchors><certificates src="system" /></trust-anchors></base-config><domain-config cleartextTrafficPermitted="true"><domain includeSubdomains="false">10.0.2.2</domain><trust-anchors><certificates src="@raw/econolab_qa_ca" /></trust-anchors></domain-config></network-security-config>');
    }
    return mod;
  }]);
};
