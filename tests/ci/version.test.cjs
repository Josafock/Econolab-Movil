const { test } = require('node:test');
const assert = require('node:assert/strict');
const { versionIssues } = require('../../scripts/ci/version.cjs');
test('release tags must identify the actual app version', () => {
  assert.deepEqual(versionIssues('1.1.0', '1.1.0', 'refs/tags/v1.1.0'), []);
  assert.ok(versionIssues('1.1.0', '1.1.0', 'refs/tags/v1.2.0').length);
  assert.ok(versionIssues('1.1.0', '1.0.0').length);
  assert.ok(versionIssues('01.1.0', '01.1.0').length);
});
