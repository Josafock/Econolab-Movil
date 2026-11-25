const fs = require('node:fs');
function versionIssues(packageVersion, appVersion, ref = '') {
  const errors = [];
  const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
  if (!semver.test(packageVersion))
    errors.push('package.json requiere SemVer MAJOR.MINOR.PATCH sin ceros iniciales.');
  if (packageVersion !== appVersion)
    errors.push('Las versiones de package.json y app.json deben coincidir.');
  if (ref.startsWith('refs/tags/v') && ref !== `refs/tags/v${packageVersion}`)
    errors.push('La etiqueta de liberación no coincide con la versión comprobada.');
  return errors;
}
if (require.main === module) {
  const packageVersion = require('../../package.json').version;
  const appVersion = require('../../app.json').expo.version;
  const errors = versionIssues(packageVersion, appVersion, process.env.GITHUB_REF);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync(
    'reports/version.json',
    JSON.stringify(
      {
        version: packageVersion,
        appVersion,
        ref: process.env.GITHUB_REF,
        commit: process.env.GITHUB_SHA,
        policy: require('../../ci/release-policy.json'),
        errors,
      },
      null,
      2,
    ),
  );
  if (errors.length) {
    process.stderr.write(errors.join('\n') + '\n');
    process.exitCode = 1;
  } else
    process.stdout.write(
      `Versionamiento verificado: ${packageVersion}; versionCode remoto de EAS.\n`,
    );
}
module.exports = { versionIssues };
