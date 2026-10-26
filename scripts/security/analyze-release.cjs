const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const [apk, jadx] = process.argv.slice(2);
if (!apk || !jadx || !fs.existsSync(apk)) throw new Error('Uso: node scripts/security/analyze-release.cjs <apk> <jadx>');
const reportDir = path.resolve('reports/native');
fs.mkdirSync(reportDir, { recursive: true });
const mapping = fs.readFileSync('android/app/build/outputs/mapping/release/mapping.txt', 'utf8');
const properties = fs.readFileSync('android/gradle.properties', 'utf8');
const log = fs.readFileSync(path.join(reportDir, 'gradle.log'), 'utf8');
const classes = [...mapping.matchAll(/^(\S+) -> (\S+):$/gm)];
const renamed = classes.filter(([, original, output]) => original !== output).length;
const r8 = /:app:minifyReleaseWithR8/.test(log) && renamed > 0;
const shrinking = /android.enableShrinkResourcesInReleaseBuilds=true/.test(properties);
const output = path.resolve('reports/jadx-release');
const result = spawnSync(jadx, ['--no-res', '--no-debug-info', '-j', '2', '-d', output, path.resolve(apk)], {
  encoding: 'utf8', timeout: 600000, maxBuffer: 8 * 1024 * 1024,
});
fs.writeFileSync(path.join(reportDir, 'jadx.log'), `${result.stdout ?? ''}\n${result.stderr ?? ''}`);
const javaFiles = fs.existsSync(path.join(output, 'sources')) ? fs.readdirSync(path.join(output, 'sources'), { recursive: true }).filter(file => file.endsWith('.java')).length : 0;
const report = {
  executedAt: new Date().toISOString(), commit: process.env.GITHUB_SHA ?? null,
  variant: 'QA Release, signing key for testing; not a Play publication',
  apkSha256: crypto.createHash('sha256').update(fs.readFileSync(apk)).digest('hex'),
  apkSizeBytes: fs.statSync(apk).size,
  r8TaskExecuted: r8, shrinkResourcesEnabled: shrinking, mappingClassCount: classes.length,
  renamedClasses: renamed, jadxVersion: '1.5.6', jadxExitCode: result.status, recoveredJavaFiles: javaFiles,
  interpretation: 'R8 changes names and reduces code/resources. JADX still recovers parts of the APK. This is not encryption of JavaScript nor proof of impossible decompilation. Preserve mapping privately for crash diagnosis.',
};
fs.writeFileSync(path.join(reportDir, 'release-analysis.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(reportDir, 'REPORTE_JADX.md'), `# Análisis del Release con R8 y JADX\n\nCommit: ${report.commit}.\n\n- Tarea R8 ejecutada y clases renombradas: ${r8}.\n- Reducción de recursos activada: ${shrinking}.\n- Clases en mapping: ${classes.length}; renombradas: ${renamed}.\n- JADX 1.5.6: salida ${result.status}; ${javaFiles} archivos Java recuperados.\n- SHA-256 APK: ${report.apkSha256}.\n\n${report.interpretation}\n\nEl build QA usa una cuenta y un certificado de pruebas; no contiene credenciales de usuarios reales. Los errores de JADX deben revisarse en jadx.log; no se ocultan ni se presentan como aprobación.\n`);
if (!r8 || !shrinking || !javaFiles || result.error) process.exitCode = 1;
