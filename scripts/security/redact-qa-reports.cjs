const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve('reports/native');
const values = ['SECURITY_QA_UI_PASSWORD', 'JWT_SECRET', 'DATABASE_PASS'].map(key => process.env[key]).filter(Boolean);
if (fs.existsSync(root)) {
  for (const file of fs.readdirSync(root, { recursive: true })) {
    const target = path.join(root, file);
    if (!fs.statSync(target).isFile() || !/\.(xml|json|log|txt|ya?ml|html|md)$/.test(file)) continue;
    const raw = fs.readFileSync(target, 'utf8');
    const cleaned = values.reduce((text, value) => text.replaceAll(value, '[REDACTED]'), raw);
    if (cleaned !== raw) fs.writeFileSync(target, cleaned);
  }
}
