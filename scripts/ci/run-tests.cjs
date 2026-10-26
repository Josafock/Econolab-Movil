const fs = require('node:fs');
const { spawnSync } = require('node:child_process');
const features = require('../../ci/features.json');

function main() {
  const featureId = process.argv[2] || 'all';
  const feature = featureId === 'all' ? null : features.find((item) => item.id === featureId);
  if (featureId !== 'all' && !feature) throw new Error('HU desconocida.');
  fs.mkdirSync('reports', { recursive: true });
  const script = require('../../package.json').scripts?.test;
  const available = feature ? feature.tests.filter((file) => fs.existsSync(file)) : [];
  const missing = feature ? feature.tests.filter((file) => !fs.existsSync(file)) : [];
  const report = {
    feature: featureId,
    issue: feature?.issue,
    available,
    missing,
    status: 'pending',
  };
  const summary = (text) => {
    if (process.env.GITHUB_STEP_SUMMARY)
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text + '\n');
  };
  if (missing.length) {
    process.stdout.write(
      `::notice::${featureId}: faltan suites específicas: ${missing.join(', ')}\n`,
    );
    summary(
      `### ${featureId}: cobertura pendiente\n${missing.map((file) => `- \`${file}\``).join('\n')}\nLa regresión compartida no acredita estos casos ausentes.`,
    );
  }
  if (!script || (feature && available.length === 0)) {
    fs.writeFileSync(`reports/${featureId}.json`, JSON.stringify(report, null, 2));
    process.stdout.write(
      `::notice::${featureId}: no hay suite de aplicación disponible para este alcance.\n`,
    );
    summary(
      `### ${featureId}: pruebas de aplicación pendientes\nNo se registran como pruebas aprobadas. Los checks de lint, TypeScript, pipeline y exportación se ejecutan por separado.`,
    );
    return;
  }
  const jest = require.resolve('jest/bin/jest');
  const args = [
    jest,
    '--ci',
    '--runInBand',
    '--json',
    '--outputFile',
    `reports/jest-${featureId}.json`,
  ];
  if (feature) args.push('--runTestsByPath', ...available);
  else
    args.push(
      '--coverage',
      '--coverageDirectory',
      'reports/coverage',
      '--coverageReporters=lcov',
      '--coverageReporters=json-summary',
    );
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });
  report.status = result.status === 0 ? 'passed' : 'failed';
  fs.writeFileSync(`reports/${featureId}.json`, JSON.stringify(report, null, 2));
  summary(
    `### ${featureId}\nResultado de las suites disponibles: **${report.status}**. ${feature ? `Issue #${feature.issue}.` : 'Regresión completa de la aplicación.'}`,
  );
  if (result.error || result.status !== 0) process.exitCode = result.status || 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(error.message + '\n');
  process.exitCode = 1;
}
