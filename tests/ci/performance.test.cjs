const { test } = require('node:test');
const assert = require('node:assert/strict');
const { compare } = require('../../scripts/ci/compare-performance.cjs');
const metric = n => ({ metrics: { http_req_duration: { values: { 'p(95)': n } } } });
test('performance comparison rejects unmeasured data and regressions over the baseline allowance', () => {
  assert.throws(() => compare({}, {}));
  assert.equal(compare(metric(200), metric(500)).passed, true);
  assert.equal(compare(metric(200), metric(900)).passed, false);
});
