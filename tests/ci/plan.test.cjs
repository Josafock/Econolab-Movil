const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { selectFeatures, changedFiles } = require('../../scripts/ci/plan.cjs');
const manifest = require('../../ci/features.json');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'econolab-ci-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const feature of manifest) for (const file of feature.markers) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'fixture');
  }
  return root;
}

test('a profile branch selects HU-06 rather than all unrelated features', t => {
  const result = selectFeatures({ root: fixture(t), branch: 'feature/HU-06-perfil' });
  assert.deepEqual(result.map(feature => feature.id), ['HU-06']);
});
test('HU-05 resolves to issue 6, never the duplicate PB issue 5', t => {
  const result = selectFeatures({ root: fixture(t), branch: 'feature/HU-05-estudios' });
  assert.deepEqual(result.map(feature => feature.issue), [6]);
});
test('task references select their parent HU', t => {
  const result = selectFeatures({ root: fixture(t), text: 'Implementa #19 y #29' });
  assert.deepEqual(result.map(feature => feature.id), ['HU-03', 'HU-06']);
});
test('changed study files are recognized on an arbitrary branch', t => {
  const result = selectFeatures({ root: fixture(t), changed: ['src/features/studies/api.ts'] });
  assert.deepEqual(result.map(feature => feature.id), ['HU-05']);
});
test('transport changes select architecture and errors together', t => {
  const result = selectFeatures({ root: fixture(t), changed: ['src/core/api.ts'] });
  assert.deepEqual(result.map(feature => feature.id), ['HU-01', 'HU-07']);
});
test('shared dependency changes and main mode cover all implemented HUs', t => {
  const root = fixture(t);
  assert.equal(selectFeatures({ root, changed: ['package-lock.json'] }).length, 8);
  assert.equal(selectFeatures({ root, full: true }).length, 8);
});
test('unimplemented HUs are never reported as implemented', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'econolab-ci-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.deepEqual(selectFeatures({ root, branch: 'feature/HU-03-autenticacion', full: true }), []);
});
test('PR metadata is data and cannot inject commands', t => {
  const result = selectFeatures({ root: fixture(t), branch: 'fix/$(echo HU-06); arbitrary', text: '`echo #28`' });
  assert.deepEqual(result.map(feature => feature.id), ['HU-06']);
});
test('new and force-pushed branches fall back to full coverage', () => {
  assert.equal(changedFiles({ before: '0'.repeat(40), after: 'a'.repeat(40) }, 'push'), null);
  assert.equal(changedFiles({ before: 'b'.repeat(40), after: 'a'.repeat(40) }, 'push', () => { throw new Error('missing commit'); }), null);
});
test('PR diff uses the merge base and preserves renamed/deleted file names', () => {
  const calls = [];
  const git = (_binary, args) => {
    calls.push(args);
    return args[0] === 'merge-base' ? 'c'.repeat(40) : 'src/features/profile/api.ts\0tests/profile.test.ts\0';
  };
  const result = changedFiles({ pull_request: { base: { sha: 'a'.repeat(40) }, head: { sha: 'b'.repeat(40) } } }, 'pull_request', git);
  assert.deepEqual(result, ['src/features/profile/api.ts', 'tests/profile.test.ts']);
  assert.equal(calls[1][3], 'c'.repeat(40));
});
