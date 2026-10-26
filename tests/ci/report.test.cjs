const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, buildReport } = require('../../scripts/ci/report.cjs');
const needs = () => ({ security: { result: 'success' }, plan: { result: 'success', outputs: { 'has-features': 'true' } }, quality: { result: 'success' }, features: { result: 'success' }, build: { result: 'success' } });
const context = { runUrl: 'https://github.com/example/repo/actions/runs/1', branch: 'feature/HU-01', createdAt: '2026-10-15', headSha: 'abc', testedSha: 'def' };

test('a failing or cancelled stage cannot pass the final merge gate', () => {
  for (const id of ['security', 'plan', 'quality', 'features', 'build']) for (const status of ['failure', 'cancelled', 'skipped']) {
    const jobs = needs(); jobs[id].result = status;
    assert.equal(evaluate(jobs).approved, false, `${id}: ${status}`);
  }
  assert.equal(evaluate({}).approved, false);
  assert.equal(evaluate(needs()).approved, true);
});

test('feature matrix may be skipped only when the successful plan explicitly selected no HUs', () => {
  const jobs = needs(); jobs.features.result = 'skipped';
  assert.equal(evaluate(jobs).approved, false);
  jobs.plan.outputs['has-features'] = 'false';
  assert.equal(evaluate(jobs).approved, true);
  jobs.plan.result = 'failure';
  assert.equal(evaluate(jobs).approved, false);
});

test('report distinguishes successful technical checks from absent application tests', () => {
  const { report, markdown, template } = buildReport({ needs: needs(), context,
    plan: { selected: [{ id: 'HU-01', issue: 1, missingTests: ['tests/api.test.ts'] }] },
    suites: [{ feature: 'all', status: 'pending' }] });
  assert.equal(report.approved, true);
  assert.equal(report.tests, null);
  assert.ok(report.pending.some(item => item.includes('tests/api.test.ts')));
  assert.match(markdown, /No hay un resultado Jest global/);
  assert.match(template, /Comparación antes \/ después/);
});

test('report preserves failure evidence and does not double-count HU reruns', () => {
  const jobs = needs(); jobs.quality.result = 'failure'; jobs.features.result = 'skipped'; jobs.build.result = 'skipped';
  const stats = { numPassedTests: 3, numFailedTests: 1, numPendingTests: 0, numTotalTests: 4, testResults: [{ assertionResults: [{ status: 'failed', fullName: 'config URL', failureMessages: ['Expected https; received http'] }] }] };
  const { report, markdown } = buildReport({ needs: jobs, context, suites: [{ feature: 'all', status: 'failed' }],
    jest: [{ ...stats, scope: 'all' }, { ...stats, scope: 'HU-01' }], qualitySteps: { tests: 'failure' } });
  assert.equal(report.approved, false);
  assert.equal(report.tests.total, 4);
  assert.equal(report.failedTests[0].name, 'config URL');
  assert.match(markdown, /Expected https; received http/);
  assert.match(markdown, /NO APROBADO/);
});

test('lost evidence blocks approval and untrusted branch names cannot inject HTML', () => {
  const { report, markdown } = buildReport({ needs: needs(), context: { ...context, branch: '<script>alert(1)</script>\n|fake|' }, evidenceErrors: ['Artifact download failed'] });
  assert.equal(report.approved, false);
  assert.ok(!markdown.includes('<script>'));
  assert.ok(markdown.includes('&lt;script&gt;'));
});

test('a required native failure blocks merging even when all JavaScript checks pass', () => {
  const jobs = needs();
  jobs.plan.outputs['native-required'] = 'true';
  jobs.native = { result: 'failure' };
  assert.equal(evaluate(jobs).approved, false);
  jobs.native.result = 'cancelled';
  assert.equal(evaluate(jobs).approved, false);
  jobs.native.result = 'success';
  assert.equal(evaluate(jobs).approved, true);
});

test('the single regression may provide feature evidence without a duplicated matrix', () => {
  const jobs = needs();
  delete jobs.features;
  jobs.quality.outputs = { features: 'success' };
  assert.equal(evaluate(jobs).approved, true);
  jobs.quality.outputs.features = 'failure';
  assert.equal(evaluate(jobs).approved, false);
});
