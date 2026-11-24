const fs = require('node:fs');
const limits = require('../../ci/service-objectives.json').comparison;
function compare(baseline, load) {
  const before = baseline.metrics?.http_req_duration?.values?.['p(95)'];
  const after = load.metrics?.http_req_duration?.values?.['p(95)'];
  if (!Number.isFinite(before) || !Number.isFinite(after))
    throw Error('Faltan métricas p95 medibles.');
  const maximum = Math.max(limits.minimumAllowanceMs, before * limits.maximumBaselineMultiplier);
  return {
    baselineP95Ms: before,
    loadP95Ms: after,
    maximumP95Ms: maximum,
    multiplier: before > 0 ? after / before : null,
    passed: after <= maximum,
  };
}
if (require.main === module) {
  const read = (name) => JSON.parse(fs.readFileSync(`reports/performance/${name}.json`, 'utf8'));
  const result = compare(read('baseline'), read('load'));
  fs.writeFileSync('reports/performance/comparison.json', JSON.stringify(result, null, 2));
  process.stdout.write(JSON.stringify(result) + '\n');
  if (!result.passed) process.exitCode = 1;
}
module.exports = { compare };
