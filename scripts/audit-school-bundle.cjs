/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const assert = require('node:assert/strict');
const directory = path.resolve(process.argv[2] || path.join(__dirname, '../artifacts/school/export'));
function files(dir) { return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)]); }
const maps = files(directory).filter(file => file.endsWith('.map'));
assert.ok(maps.length >= 2, 'Exporta Android e iOS con --source-maps.');
const report = maps.map(file => {
  const map = JSON.parse(fs.readFileSync(file));
  const app = map.sources.map((source, i) => ({ source: source.split(String.fromCharCode(92)).join('/'), content: map.sourcesContent?.[i] || '' })).filter(row => /(^|\/)src\//.test(row.source) && !row.source.includes('node_modules'));
  const retired = app.filter(row => /features\/(studies|cash-cuts|dashboard|about)\//.test(row.source));
  const fields = app.filter(row => /referenceValue|sampleType|Laboratorio clínico|expedientes clínicos/.test(row.content));
  assert.equal(retired.length, 0, 'El paquete incluye módulos retirados: ' + retired.map(row => row.source).join(','));
  assert.equal(fields.length, 0, 'El paquete incluye contenido fuera del alcance: ' + fields.map(row => row.source).join(','));
  assert.ok(app.some(row => row.source.endsWith('/school/SchoolViewModel.ts')), 'Falta el módulo Aula.');
  return { platform: file.includes('android') ? 'android' : 'ios', projectSources: app.length, retiredModules: 0, clinicalFields: 0, schoolSources: app.filter(row => row.source.includes('/school/')).map(row => 'src/' + row.source.split('/src/').pop()) };
});
process.stdout.write(JSON.stringify({ scope: 'Source maps de las exportaciones Hermes de la edición Aula', report }, null, 2) + '\n');
