const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { summarize } = require('../../scripts/ci/feature-evidence.cjs');
test('a missing mapped suite is pending, never a passing feature', () => {
  const feature = { id: 'HU-01', issue: 1, tests: ['tests/config.test.ts'] };
  assert.equal(summarize(feature, []).status, 'pending');
  assert.equal(summarize(feature, [{ name: path.resolve(feature.tests[0]), status: 'failed' }]).status, 'failed');
  assert.equal(summarize(feature, [{ name: path.resolve(feature.tests[0]), status: 'passed' }]).status, 'passed');
});
