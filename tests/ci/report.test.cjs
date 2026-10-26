const { test } = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, buildReport, selectEvidenceArtifacts } = require('../../scripts/ci/report.cjs');
const needs = () => ({ security: { result: 'success' }, plan: { result: 'success', outputs: { 'has-features': 'true' } }, quality: { result: 'success' }, features: { result: 'success' }, build: { result: 'success' } });
const context = { runUrl: 'https://github.com/example/repo/actions/runs/1', branch: 'feature/HU-01', createdAt: '2026-10-15', headSha: 'abc', testedSha: 'def' };

test('partial reruns select each latest artifact numerically within the same run', () => {
  assert.deepEqual(selectEvidenceArtifacts([
    'regression-123-2', 'regression-123-10', 'regression-123-1',
    'security-sast-123-1', 'security-dast-123-2', 'security-dast-123-1',
    'regression-999-10', 'regression-123-11',
  ], '123', '10'), {
    regression: 'regression-123-10',
    'security-sast': 'security-sast-123-1',
    'security-dast': 'security-dast-123-2',
  });
});

test('missing artifacts stay absent and invalid run context cannot select foreign evidence', () => {
  assert.deepEqual(selectEvidenceArtifacts(['plan.json', 'regression-9-1', 'security-sast-8-2'], '8', '1'), {});
  assert.throws(() => selectEvidenceArtifacts(['regression-8-1'], '8.*', '1'), /inválido/);
});

test('the report process reads grouped evidence and rejects a missing mandatory artifact', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const os = require('node:os');
  const { spawnSync } = require('node:child_process');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'econolab-report-'));
  const evidence = path.join(directory, 'reports/evidence');
  const write = (file, value) => {
    const target = path.join(evidence, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(value));
  };
  const jobs = needs();
  write('plan.json', { selected: [] });
  write('regression-123-1/jest-all.json', { numPassedTests: 1, numTotalTests: 1 });
  write('regression-123-2/jest-all.json', { numPassedTests: 2, numTotalTests: 2 });
  write('security-sast-123-1/semgrep.json', { results: [] });
  write('security-dast-123-1/dast.json', { cases: [{ passed: true }] });
  const run = () => {
    const result = spawnSync(process.execPath, [require.resolve('../../scripts/ci/report.cjs')], {
      cwd: directory,
      encoding: 'utf8',
      env: { ...process.env, GITHUB_RUN_ID: '123', GITHUB_RUN_ATTEMPT: '2',
        GITHUB_EVENT_PATH: '', GITHUB_OUTPUT: '', GITHUB_STEP_SUMMARY: '',
        CI_NEEDS: JSON.stringify(jobs),
        CI_REPORT_STEPS: JSON.stringify({ plan_evidence: { conclusion: 'success' }, quality_evidence: { conclusion: 'success' } }),
      },
    });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(fs.readFileSync(path.join(directory, 'reports/final/reporte-ci.json'), 'utf8'));
  };
  try {
    const approved = run();
    assert.equal(approved.approved, true);
    assert.equal(approved.tests.passed, 2);
    assert.equal(approved.integration.length, 1);
    assert.equal(approved.evidenceArtifacts.regression, 'regression-123-2');
    fs.renameSync(path.join(evidence, 'security-sast-123-1'), path.join(evidence, 'unrecognized'));
    const rejected = run();
    assert.equal(rejected.approved, false);
    assert.ok(rejected.failures.includes('Falta artifact obligatorio: security-sast.'));
  } finally {
    assert.ok(fs.realpathSync(directory).startsWith(fs.realpathSync(os.tmpdir()) + path.sep));
    fs.rmSync(directory, { recursive: true });
  }
});

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
