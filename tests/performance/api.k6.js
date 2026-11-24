import http from 'k6/http';
import { check, sleep } from 'k6';
const objectives = JSON.parse(open('../../ci/service-objectives.json'));

const scenario = __ENV.SCENARIO || 'baseline';
const base = __ENV.QA_API_URL || 'http://127.0.0.1:3109/api';
if (!/^http:\/\/(127\.0\.0\.1|localhost):3109\/api$/.test(base)) throw new Error('k6 solo acepta el backend aislado loopback de QA.');
const config = objectives[scenario === 'baseline' || scenario === 'load' ? 'performance' : scenario];
if (!config) throw new Error('Escenario desconocido.');
export const options = {
  ...(scenario === 'stress' ? { stages: [
    { duration: `${config.rampSeconds}s`, target: 10 },
    { duration: `${config.rampSeconds}s`, target: 25 },
    { duration: `${config.rampSeconds}s`, target: config.maxVus },
    { duration: `${config.holdSeconds}s`, target: config.maxVus },
    { duration: `${config.rampSeconds}s`, target: 0 },
  ] } : { vus: scenario === 'baseline' ? config.baselineVus : scenario === 'load' ? config.loadVus : config.vus,
    duration: `${scenario === 'baseline' ? config.baselineSeconds : scenario === 'load' ? config.loadSeconds : config.seconds}s` }),
  thresholds: { http_req_duration: [`p(95)<${config.p95Ms}`], http_req_failed: [`rate<=${config.errorRate}`], checks: ['rate==1'] },
};
export function setup() {
  if (!__ENV.SECURITY_QA_UI_PASSWORD) throw new Error('Falta la credencial desechable del entorno.');
  const response = http.post(`${base}/auth/login`, JSON.stringify({ email: 'native-debug@example.test', password: __ENV.SECURITY_QA_UI_PASSWORD, mobile: true }), { headers: { 'Content-Type': 'application/json' } });
  if (response.status !== 201) throw new Error('No se pudo iniciar la sesión de carga aislada.');
  return { token: response.json('token') };
}
export default function (session) {
  const response = http.get(`${base}/studies?page=1&limit=10`, { headers: { Authorization: `Bearer ${session.token}` }, tags: { operation: 'list-studies', scenario } });
  check(response, { 'catálogo disponible con datos QA': r => r.status === 200 && Array.isArray(r.json('data')) && r.json('data').length > 0 });
  sleep(0.25);
}
export function handleSummary(data) {
  return { [`reports/performance/${scenario}.json`]: JSON.stringify({ ...data, scenario, target: 'isolated NestJS and PostgreSQL', objectives: config }, null, 2) };
}
