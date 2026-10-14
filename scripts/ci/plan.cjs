const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const features = require('../../ci/features.json');
const isGlobalFile = file => /^(package(-lock)?\.json|tsconfig\.json|app\.json|eslint\.config\.|\.github\/|scripts\/ci\/|ci\/|tests\/ci\/)/.test(file);

function implemented(root, feature) {
  return feature.markers.some(file => fs.existsSync(path.join(root, file)));
}

function selectFeatures({ root, branch = '', text = '', changed = [], full = false }) {
  const available = features.filter(feature => implemented(root, feature));
  const globalChange = changed.some(isGlobalFile);
  if (full || globalChange) return available;
  const branchHus = [...branch.matchAll(/HU[-_]?0?([1-8])\b/gi)].map(match => `HU-0${match[1]}`);
  const issueRefs = [...text.matchAll(/(?:#|\/issues\/)(\d+)\b/g)].map(match => Number(match[1]));
  return available.filter(feature => branchHus.includes(feature.id)
    || [feature.issue, ...feature.tasks].some(issue => issueRefs.includes(issue))
    || changed.some(file => feature.paths.some(prefix => prefix.endsWith('/') ? file.startsWith(prefix) : file === prefix)));
}

function shouldPrebuild({ full = false, changed = [], selected = [] }) {
  return full || changed.some(isGlobalFile) || selected.some(feature => feature.id === 'HU-02');
}

function changedFiles(event, eventName, git = execFileSync) {
  const isPr = eventName === 'pull_request';
  const base = isPr ? event.pull_request?.base?.sha : event.before;
  const head = isPr ? event.pull_request?.head?.sha : event.after;
  const valid = value => typeof value === 'string' && /^[a-f0-9]{40,64}$/.test(value) && !/^0+$/.test(value);
  if (!valid(base) || !valid(head)) return null;
  try {
    const comparison = isPr ? git('git', ['merge-base', base, head], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim() : base;
    return git('git', ['diff', '--name-only', '-z', comparison, head], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).split('\0').filter(Boolean);
  } catch {
    return null; // A new branch or missing/rewritten history requires conservative full coverage.
  }
}

function main() {
  const root = process.cwd();
  const event = process.env.GITHUB_EVENT_PATH ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')) : {};
  const branch = event.pull_request?.head?.ref || process.env.GITHUB_REF_NAME || '';
  const changed = changedFiles(event, process.env.GITHUB_EVENT_NAME);
  const full = process.env.CI_FULL === 'true' || branch === 'main' || changed === null;
  const selected = selectFeatures({ root, branch, changed: changed || [], full,
    text: `${event.pull_request?.title || ''}\n${event.pull_request?.body || ''}` });
  const matrix = { include: selected.map(feature => ({ feature: feature.id, issue: feature.issue, title: feature.title })) };
  const native = shouldPrebuild({ full, changed: changed || [], selected });
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/plan.json', JSON.stringify({ branch, full, changed, selected: selected.map(feature => ({ ...feature,
    availableTests: feature.tests.filter(file => fs.existsSync(file)), missingTests: feature.tests.filter(file => !fs.existsSync(file)) })) }, null, 2));
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT,
    `matrix=${JSON.stringify(matrix)}\nhas-features=${selected.length > 0}\nnative=${native}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    `## Plan por issue\nModo: ${full ? 'completo' : 'feature y archivos modificados'}.\n\n`
    + (selected.length ? '| HU | Issue | Alcance |\n|---|---|---|\n' + selected.map(feature => `| ${feature.id} | #${feature.issue} | ${feature.acceptance} |`).join('\n')
      : 'La rama todavía no contiene módulos de las HUs. Se valida la plantilla y el propio pipeline; no se acredita aceptación funcional de las HUs.') + '\n');
  process.stdout.write(JSON.stringify({ branch, full, matrix, native }) + '\n');
}

module.exports = { selectFeatures, changedFiles, shouldPrebuild };
if (require.main === module) main();
