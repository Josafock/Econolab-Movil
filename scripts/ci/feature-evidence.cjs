const fs = require('node:fs');
const path = require('node:path');
function summarize(feature, results) {
  const names = new Set(feature.tests.map((file) => path.resolve(file).replaceAll('\\', '/')));
  const matches = results.filter((result) => names.has(result.name.replaceAll('\\', '/')));
  const available = matches.map((result) =>
    path.relative(process.cwd(), result.name).replaceAll('\\', '/'),
  );
  const missing = feature.tests.filter((file) => !available.includes(file));
  return {
    feature: feature.id,
    issue: feature.issue,
    available,
    missing,
    status: matches.some((result) => result.status === 'failed')
      ? 'failed'
      : matches.length
        ? 'passed'
        : 'pending',
    execution:
      'Derived from the single global Jest regression; cases are not executed or counted twice.',
  };
}
if (require.main === module) {
  const plan = JSON.parse(fs.readFileSync('reports/plan.json', 'utf8'));
  const regression = JSON.parse(fs.readFileSync('reports/jest-all.json', 'utf8'));
  let failed = false;
  for (const feature of plan.selected) {
    const report = summarize(feature, regression.testResults);
    fs.writeFileSync(`reports/${feature.id}.json`, JSON.stringify(report, null, 2));
    failed ||= report.status !== 'passed' || report.missing.length > 0;
  }
  if (failed) {
    process.stderr.write(
      'Una HU implementada carece de la evidencia de pruebas requerida o tiene fallos.\n',
    );
    process.exitCode = 1;
  }
}
module.exports = { summarize };
