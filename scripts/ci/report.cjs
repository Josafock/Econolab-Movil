const fs = require('node:fs');
const path = require('node:path');

function evaluate(needs = {}) {
  const failures = [];
  for (const id of ['security', 'plan', 'quality', 'build']) {
    if (needs[id]?.result !== 'success') failures.push(`${id}: ${needs[id]?.result || 'unknown'}`);
  }
  const noFeatures = needs.plan?.outputs?.['has-features'] === 'false';
  const featureResult = needs.features?.result || needs.quality?.outputs?.features;
  if (featureResult !== 'success' && !(noFeatures && featureResult === 'skipped')) {
    failures.push(`features: ${featureResult || 'unknown'}`);
  }
  if (needs.plan?.outputs?.['native-required'] === 'true' && needs.native?.result !== 'success')
    failures.push(`native: ${needs.native?.result || 'unknown'}`);
  return { approved: failures.length === 0, failures };
}

const clean = (value) => String(value ?? '').replace(/\u001b\[[0-9;]*m/g, '');
const html = (value) =>
  clean(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const md = (value) =>
  html(value)
    .replace(/[\\`*_[\]{}|]/g, '\\$&')
    .replace(/\r?\n/g, ' ');

function buildReport({
  needs,
  context,
  plan,
  suites = [],
  jest = [],
  qualitySteps = {},
  coverage,
  evidenceErrors = [],
  diagnostics = [],
  measurements = [],
  integration = [],
  scanners = {},
}) {
  const result = evaluate(needs);
  if (evidenceErrors.length) {
    result.approved = false;
    result.failures.push(...evidenceErrors);
  }
  const pending = [
    ...new Set([
      ...suites.flatMap((suite) =>
        (suite.missing || []).map((file) => `${suite.feature}: falta ${file}`),
      ),
      ...suites
        .filter((suite) => suite.status === 'pending')
        .map(
          (suite) => `${suite.feature}: no se ejecutaron pruebas de aplicación para este alcance`,
        ),
      ...(plan?.selected || []).flatMap((feature) =>
        (feature.missingTests || []).map((file) => `${feature.id}: falta ${file}`),
      ),
    ]),
  ];
  if (needs.native?.result === 'skipped')
    pending.push(
      'Appium y compilación nativa no solicitados en esta ejecución; son obligatorios en la liberación.',
    );
  if (plan && !plan.selected?.length)
    pending.push(
      'El código no contiene HUs implementadas reconocibles; se validó la base técnica.',
    );
  if (!suites.some((suite) => suite.feature === 'all'))
    pending.push(
      'No se recibió resultado de regresión de aplicación; revisar si la etapa se omitió por un error anterior.',
    );
  const totals = jest.find((item) => item.scope === 'all'); // Las suites por HU repiten casos: no se suman.
  const failedTests = jest.flatMap((item) =>
    (item.testResults || []).flatMap((file) => {
      const failures = (file.assertionResults || [])
        .filter((test) => test.status === 'failed')
        .map((test) => ({
          scope: item.scope,
          name: test.fullName || test.title,
          details: clean((test.failureMessages || []).join('\n')),
        }));
      if (!failures.length && file.status === 'failed')
        failures.push({
          scope: item.scope,
          name: file.name,
          details: clean(file.message || 'Fallo de carga o ejecución de la suite.'),
        });
      return failures;
    }),
  );
  const report = {
    schemaVersion: 1,
    ...context,
    ...result,
    jobs: Object.fromEntries(Object.entries(needs).map(([id, value]) => [id, value.result])),
    qualitySteps,
    plan: plan || null,
    pending,
    tests: totals
      ? {
          passed: totals.numPassedTests,
          failed: totals.numFailedTests,
          pending: totals.numPendingTests,
          total: totals.numTotalTests,
          suitesPassed: totals.numPassedTestSuites,
          suitesFailed: totals.numFailedTestSuites,
        }
      : null,
    coverage: coverage?.total || null,
    failedTests,
    diagnostics,
    measurements,
    integration,
    scanners,
  };
  const lines = [
    '# Reporte de CI y seguimiento de Econolab',
    '',
    `**Resultado técnico: ${result.approved ? 'APROBADO' : 'NO APROBADO'}.**${pending.length ? ' Hay cobertura o comprobaciones pendientes; no equivale a aceptación funcional completa.' : ''}`,
    '',
    `- Fecha UTC: ${md(context.createdAt)}`,
    `- Rama: ${md(context.branch)} → ${md(context.base || '—')}`,
    `- PR: ${md(context.pr || 'No aplica')}`,
    `- Autor del evento: ${md(context.actor)}`,
    `- Commit de la rama: ${md(context.headSha)}`,
    `- Commit probado: ${md(context.testedSha)} (en PR puede ser el merge provisional con main).`,
    `- Evento: ${md(context.event)}; intento: ${md(context.attempt)}`,
    `- Ejecución y logs: ${context.runUrl}`,
    `- Artifacts de origen: ${md(JSON.stringify(context.evidenceArtifacts || {}))}. En repetición parcial pueden proceder de un intento anterior del mismo run y commit.`,
    '',
    '## Etapas',
    '',
    '| Etapa | Resultado |',
    '|---|---|',
    ...Object.entries(report.jobs).map(([id, value]) => `| ${md(id)} | ${md(value)} |`),
    '',
    '### Detalle de calidad',
    '',
    ...Object.entries(qualitySteps).map(([id, value]) => `- ${md(id)}: ${md(value)}`),
    '',
    '## HUs e issues relacionadas',
    '',
    ...(plan?.selected?.length
      ? plan.selected.map(
          (feature) =>
            `- ${md(feature.id)} / issue #${feature.issue}: ${md(feature.title)}. ${md(feature.acceptance)}`,
        )
      : ['Sin HUs seleccionadas o sin evidencia de selección disponible.']),
    '',
    '## Pruebas y cobertura',
    '',
    totals
      ? `Regresión global: ${totals.numPassedTests} aprobadas, ${totals.numFailedTests} fallidas y ${totals.numPendingTests} pendientes; ${totals.numTotalTests} casos en total. No se duplican los casos repetidos por HU.`
      : 'No hay un resultado Jest global disponible. No se declara una ejecución de pruebas aprobada.',
    '',
    ...jest.map(
      (item) =>
        `- ${md(item.scope)}: ${item.numPassedTests} aprobadas / ${item.numFailedTests} fallidas / ${item.numPendingTests} pendientes.`,
    ),
    '',
    ...(coverage?.total
      ? Object.entries(coverage.total)
          .filter(([, value]) => typeof value.pct === 'number')
          .map(([key, value]) => `- Cobertura ${md(key)}: ${value.pct}%.`)
      : ['Cobertura de aplicación no disponible para esta ejecución.']),
    '',
    '## Integración rendimiento y esfuerzo',
    '',
    integration.length
      ? `Backend NestJS y PostgreSQL aislados: ${integration.filter((item) => item.passed).length}/${integration.length} casos aprobados.`
      : 'Sin resultado de integración aislada disponible.',
    '',
    '| Escenario k6 | p95 ms | Solicitudes | Tasa de error |',
    '|---|---|---|---|',
    ...measurements.map(
      (item) =>
        `| ${md(item.scenario)} | ${item.p95Ms?.toFixed(2) ?? 'sin medición'} | ${item.requests ?? '—'} | ${item.errorRate === undefined ? 'sin medición' : (100 * item.errorRate).toFixed(2) + '%'} |`,
    ),
    '',
    'Estas mediciones corresponden al servicio aislado de QA; no son latencia ni disponibilidad de producción, RAM o batería del teléfono.',
    `SAST y dependencias: ${md(JSON.stringify(scanners))}. Los avisos no críticos requieren seguimiento; un análisis sin hallazgos no sustituye un pentest.`,
    '',
    '## Pendientes y límites de la evidencia',
    '',
    ...(pending.length
      ? pending.map((item) => `- ${md(item)}`)
      : ['Sin suites ausentes detectadas en el alcance seleccionado.']),
    '- La integración medida usa un backend y PostgreSQL reales en QA aislado. El workflow posterior contra el backend operativo tiene evidencia independiente; este reporte no acredita producción.',
    '- Las entregas son bundles y recursos; no acreditan instalación física, aceptación de usuario ni publicación en tiendas.',
    '',
    '## Errores y diagnóstico',
    '',
    ...(result.failures.length
      ? result.failures.map((item) => `- ${md(item)}`)
      : ['No se detectaron fallos en las etapas obligatorias.']),
    ...failedTests
      .slice(0, 20)
      .flatMap((test) => [
        '',
        `### ${md(test.scope)}: ${md(test.name)}`,
        '',
        '<pre>',
        html(test.details.slice(0, 12000)),
        '</pre>',
      ]),
    ...diagnostics.map((log) => `\n### ${md(log.file)}\n\n<pre>\n${html(log.text)}\n</pre>`),
    '',
    'Los logs completos están en la ejecución enlazada; la evidencia adjunta conserva los JSON y logs disponibles. Un fallo de instalación o del runner puede impedir producir parte de esa evidencia.',
    '',
    '## Seguimiento sugerido',
    '',
    ...(result.approved
      ? [
          '1. Revisar los pendientes y confirmar los criterios de aceptación mediante pruebas funcionales o de dispositivo.',
          '2. Si es un PR, revisar el cambio y completar el merge cuando GitHub permita hacerlo; el check no hace merge automáticamente.',
          '3. Después del merge, registrar la ejecución de main y la integración real, si está configurada.',
        ]
      : [
          '1. Identificar la primera etapa fallida y revisar sus logs; distinguir error de código, configuración, dependencias o infraestructura.',
          '2. Registrar causa, responsable y corrección en la plantilla adjunta. Los trabajos omitidos no cuentan como pruebas aprobadas.',
          '3. Corregir en la misma rama, hacer push y comparar la nueva ejecución con esta evidencia.',
          '4. Completar el merge únicamente cuando el check obligatorio del PR apruebe y se cumplan los demás requisitos.',
        ]),
    '',
    'Se adjunta seguimiento.md para documentar el análisis humano. No se crean ni modifican issues o tarjetas del Project.',
    '',
  ];
  const template = [
    '# Seguimiento del cambio',
    '',
    `Evidencia inicial: ${context.runUrl}`,
    `Rama / PR: ${md(context.branch)} / ${md(context.pr || 'No aplica')}`,
    `Commit: ${md(context.headSha)}`,
    `Resultado técnico inicial: ${result.approved ? 'APROBADO' : 'NO APROBADO'}`,
    '',
    '| Campo | Información por completar |',
    '|---|---|',
    '| HU / issue y objetivo del cambio | |',
    '| Responsable | |',
    '| Fecha de revisión | |',
    '| Resultado esperado y resultado observado | |',
    '| Etapa, caso fallido o criterio validado | |',
    '| Causa identificada; pendiente de análisis si aún no se conoce | |',
    '| Impacto y prioridad | |',
    '| Corrección o validación adicional | |',
    '| Commit de corrección y nueva ejecución | |',
    '| Comparación antes / después | |',
    '| Pruebas manuales o de dispositivo y evidencias | |',
    '| Resultado de main e integración posterior | |',
    '| Pendientes, fecha compromiso y estado | |',
    '| Criterio de cierre y persona que valida | |',
    '',
    'Un resultado verde no resuelve automáticamente los pendientes ni cierra la issue. Adjunta evidencia de los criterios que realmente se revisaron.',
    '',
  ].join('\n');
  return { report, markdown: lines.join('\n'), template };
}

function selectEvidenceArtifacts(names, runId, attempt) {
  if (!/^\d+$/.test(String(runId)) || !/^\d+$/.test(String(attempt)))
    throw new Error('Contexto de ejecución inválido para seleccionar evidencia.');
  const selected = {};
  const pattern = new RegExp(`^(regression|security-sast|security-dast)-${runId}-(\\d+)$`);
  for (const name of names) {
    const match = pattern.exec(name);
    if (!match || Number(match[2]) > Number(attempt)) continue;
    const previous = selected[match[1]];
    if (!previous || Number(match[2]) > Number(previous.split('-').at(-1)))
      selected[match[1]] = name;
  }
  return selected;
}

function main() {
  const evidence = path.resolve('reports/evidence');
  const data = [];
  const evidenceErrors = [];
  const diagnostics = [];
  const artifacts = selectEvidenceArtifacts(
    fs.existsSync(evidence) ? fs.readdirSync(evidence) : [],
    process.env.GITHUB_RUN_ID,
    process.env.GITHUB_RUN_ATTEMPT,
  );
  const selectedFolders = new Set(Object.values(artifacts));
  if (fs.existsSync(evidence))
    for (const file of fs.readdirSync(evidence, { recursive: true })) {
      if (file !== 'plan.json' && !selectedFolders.has(file.split(path.sep)[0])) continue;
      const absolute = path.join(evidence, file);
      if (!fs.statSync(absolute).isFile()) continue;
      if (file.endsWith('.json')) {
        try {
          data.push({
            file,
            name: path.basename(file),
            value: JSON.parse(fs.readFileSync(absolute, 'utf8')),
          });
        } catch {
          evidenceErrors.push(`Evidencia JSON ilegible: ${file}`);
        }
      } else if (/\b(lint|typecheck|format)\.log$/.test(file)) {
        diagnostics.push({ file, text: clean(fs.readFileSync(absolute, 'utf8')).slice(-16000) });
      }
    }
  const steps = JSON.parse(process.env.CI_REPORT_STEPS || '{}');
  for (const id of ['plan_evidence', 'quality_evidence', 'security_evidence']) {
    if (steps[id]?.conclusion !== 'success')
      evidenceErrors.push(`Recuperación de evidencia ${id}: ${steps[id]?.conclusion || 'unknown'}`);
  }
  const needs = JSON.parse(process.env.CI_NEEDS || '{}');
  for (const [job, required] of [
    ['quality', ['regression']],
    ['security', ['security-sast', 'security-dast']],
  ]) {
    if (needs[job]?.result === 'success')
      for (const name of required)
        if (!artifacts[name]) evidenceErrors.push(`Falta artifact obligatorio: ${name}.`);
  }
  const event = process.env.GITHUB_EVENT_PATH
    ? JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'))
    : {};
  const pr = event.pull_request;
  const context = {
    createdAt: new Date().toISOString(),
    branch: pr?.head?.ref || process.env.GITHUB_REF_NAME,
    base: pr?.base?.ref,
    pr: pr?.html_url,
    actor: process.env.GITHUB_ACTOR,
    event: process.env.GITHUB_EVENT_NAME,
    headSha: pr?.head?.sha || process.env.GITHUB_SHA,
    testedSha: process.env.GITHUB_SHA,
    attempt: process.env.GITHUB_RUN_ATTEMPT,
    evidenceArtifacts: artifacts,
    runUrl: `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  };
  const plan = data.find((item) => item.name === 'plan.json')?.value;
  if (needs.plan?.result === 'success' && !plan)
    evidenceErrors.push('Falta plan.json de una etapa plan aprobada.');
  const result = buildReport({
    needs,
    context,
    plan,
    evidenceErrors,
    diagnostics,
    suites: data
      .filter((item) => /^(all|HU-0[1-8])\.json$/.test(item.name))
      .map((item) => item.value),
    jest: data
      .filter((item) => /^jest-.*\.json$/.test(item.name))
      .map((item) => ({ ...item.value, scope: item.name.slice(5, -5) })),
    qualitySteps: data.find((item) => item.name === 'quality-steps.json')?.value,
    coverage: data.find((item) => item.name === 'coverage-summary.json')?.value,
    integration: data.find((item) => item.name === 'dast.json')?.value?.cases || [],
    measurements: data
      .filter((item) => /^(baseline|load|stress|recovery)\.json$/.test(item.name))
      .map((item) => ({
        scenario: item.value.scenario,
        p95Ms: item.value.metrics?.http_req_duration?.values?.['p(95)'],
        requests: item.value.metrics?.http_reqs?.values?.count,
        errorRate: item.value.metrics?.http_req_failed?.values?.rate,
      })),
    scanners: {
      semgrepFindings: data.find((item) => item.name === 'semgrep.json')?.value?.results?.length,
      dependencies: data.find((item) => item.name === 'dependencies.json')?.value?.metadata
        ?.vulnerabilities,
      performanceComparison: data.find((item) => item.name === 'comparison.json')?.value,
    },
  });
  fs.mkdirSync('reports/final', { recursive: true });
  fs.writeFileSync('reports/final/reporte-ci.md', result.markdown);
  fs.writeFileSync('reports/final/reporte-ci.json', JSON.stringify(result.report, null, 2));
  fs.writeFileSync('reports/final/seguimiento.md', result.template);
  if (process.env.GITHUB_STEP_SUMMARY)
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, result.markdown);
  if (process.env.GITHUB_OUTPUT)
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `approved=${result.report.approved}\n`);
  process.stdout.write(
    `Reporte generado: ${result.report.approved ? 'APROBADO' : 'NO APROBADO'}; ${result.report.pending.length} pendientes.\n`,
  );
}

module.exports = { evaluate, buildReport, selectEvidenceArtifacts };
if (require.main === module) main();
