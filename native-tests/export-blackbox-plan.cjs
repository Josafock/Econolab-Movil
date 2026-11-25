const fs = require('node:fs');
const path = require('node:path');
const yaml = require('yaml');
const cases = require('../docs/evidencias-pruebas/2026-11-24/CAJA_NEGRA_CASOS.json');
const plan = cases.map(test => {
  if (!/^CN\d{2}$/.test(test.id)) throw new Error('Invalid case id');
  const file = path.join('.maestro/school-cases', test.id + '.yml');
  const documents = yaml.parseAllDocuments(fs.readFileSync(file, 'utf8'));
  if (documents.some(document => document.errors.length)) throw new Error('Invalid UI case YAML');
  return { ...test, commands: documents[1].toJSON() };
});
fs.mkdirSync('reports/native', { recursive: true });
fs.writeFileSync('reports/native/blackbox-plan.json', JSON.stringify(plan, null, 2) + '\n');
process.stdout.write('UI plan exported: ' + plan.length + ' cases.\n');
