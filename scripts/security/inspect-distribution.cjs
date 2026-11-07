const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const [apk, jadx] = process.argv.slice(2);
if (!apk || !jadx) throw new Error('Uso: node scripts/security/inspect-distribution.cjs <apk> <jadx>');
const expected = require('../../docs/evidencias-rubrica/APK_ACTUAL.json');
const hash = crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex');
if (hash !== expected.sha256) throw new Error('El APK no coincide con el build de distribución identificado.');
const dir = path.resolve('reports/distribution');
fs.mkdirSync(dir, { recursive: true });
const decoded = path.resolve('reports/distribution-decoded');
const result = spawnSync(jadx, ['--no-res', '--no-debug-info', '-j', '2', '-d', decoded, path.resolve(apk)], {
  encoding: 'utf8', timeout: 600000, maxBuffer: 8 * 1024 * 1024,
});
fs.writeFileSync(path.join(dir, 'jadx.log'), `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
const sourceDir = path.join(decoded, 'sources');
const files = fs.existsSync(sourceDir) ? fs.readdirSync(sourceDir, { recursive: true }).filter(file => file.endsWith('.java')).length : 0;
const report = {
  executedAt: new Date().toISOString(), workflowCommit: process.env.GITHUB_SHA ?? null,
  sourceCommit: expected.sourceCommit, buildId: expected.buildId,
  variant: 'EAS preview Release firmado, paquete de distribución com.econolab.mobile',
  apkSha256: hash, apkSizeBytes: fs.statSync(apk).size,
  signatureVerification: 'apksigner verify --verbose --print-certs; salida completa en apksigner.txt',
  jadxVersion: '1.5.6', jadxExitCode: result.status, recoveredJavaFiles: files,
  r8Evidence: 'Tarea minifyReleaseWithR8 y BUILD SUCCESSFUL en el log de EAS; no se dispone del mapping de producción en este análisis.',
  limits: 'La ofuscación no impide recuperar código ni cifra el bundle JavaScript. Los errores parciales de JADX se conservan en jadx.log. Este análisis no ejecuta la app ni acredita publicación en Play.',
};
fs.writeFileSync(path.join(dir, 'analysis.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'REPORTE_APK.md'), `# Inspección del APK distribuible\n\nBuild EAS: ${report.buildId}. Código fuente: ${report.sourceCommit}.\n\n- SHA-256: ${hash}.\n- Tamaño: ${report.apkSizeBytes} bytes.\n- Firma: verificación criptográfica con apksigner; consultar apksigner.txt.\n- JADX ${report.jadxVersion}: código de salida ${result.status}; ${files} archivos Java recuperados.\n- R8: ${report.r8Evidence}\n\n${report.limits}\n`);
if (result.error || !files) process.exitCode = 1;
