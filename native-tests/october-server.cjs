// Executes with ts-node in the pinned backend checkout, never in the deployed server.
require('reflect-metadata');
const assert = require('node:assert/strict');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { createServer } = require('node:https');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ConfigModule } = require('@nestjs/config');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { DataSource } = require('typeorm');
const { AuthModule } = require('../src/auth/auth.module');
const { UsersModule } = require('../src/users/users.module');
const { PrivacyModule } = require('../src/privacy/privacy.module');
const { SecurityModule } = require('../src/security/security.module');
const { StudiesModule } = require('../src/studies/studies.module');
const { CashCutsModule } = require('../src/cash-cuts/cash-cuts.module');
const { SecurityService } = require('../src/security/security.service');
const { User } = require('../src/users/entities/user.entity');
const { Role } = require('../src/common/enums/roles.enum');
const { hashPassword } = require('../src/common/utils/crypto.util');
const { Study } = require('../src/studies/entities/study.entity');
const { StudyDetail, StudyDetailType } = require('../src/studies/entities/study-detail.entity');
const { Patient } = require('../src/patients/entities/patient.entity');
const { ServiceOrder, ServiceStatus } = require('../src/services/entities/service-order.entity');

if (!['localhost', '127.0.0.1', '::1'].includes(process.env.DATABASE_HOST ?? '') ||
    !process.env.DATABASE_NAME?.endsWith('_test') || process.env.NODE_ENV !== 'test' ||
    !process.env.SECURITY_QA_UI_PASSWORD || !process.env.SECURITY_QA_TLS_KEY) {
  throw new Error('Only a disposable local test database and generated QA credentials are allowed.');
}
process.env.GOOGLE_CLIENT_ID = 'local-qa';
process.env.GOOGLE_CLIENT_SECRET = 'not-used-by-local-qa';
process.env.GOOGLE_CALLBACK_URL = 'http://127.0.0.1:3109/api/auth/google/callback';
const database = { type: 'postgres', host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT), username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS, database: process.env.DATABASE_NAME };
class OctoberTestModule {}
Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
  TypeOrmModule.forRoot({ ...database, autoLoadEntities: true, synchronize: true }),
  AuthModule, UsersModule, PrivacyModule, SecurityModule, StudiesModule, CashCutsModule,
] })(OctoberTestModule);

async function run() {
  mkdirSync('reports/october', { recursive: true });
  const bootstrap = await new DataSource(database).initialize();
  try { await bootstrap.query('CREATE SCHEMA IF NOT EXISTS operativo'); }
  finally { await bootstrap.destroy(); }
  const app = await NestFactory.create(OctoberTestModule, { logger: ['error'], abortOnError: false });
  app.use(require('helmet')(app.get(SecurityService).buildHelmetConfig()));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
    transformOptions: { enableImplicitConversion: true } }));
  app.setGlobalPrefix('api');
  await app.listen(3109, '127.0.0.1');
  const db = app.get(DataSource);
  const users = db.getRepository(User);
  await users.save(users.create({ nombre: 'Equipo QA Octubre', email: 'octubre@example.test',
    password: await hashPassword(process.env.SECURITY_QA_UI_PASSWORD), rol: Role.Admin, confirmed: true }));
  const studies = db.getRepository(Study);
  const study = await studies.save(studies.create({ name: 'Estudio QA seguro', code: 'QA-OCT', normalPrice: 120 }));
  await db.getRepository(StudyDetail).save({ studyId: study.id, name: 'Parametro QA',
    dataType: StudyDetailType.PARAMETER, unit: 'QA', referenceValue: 'Solo pruebas' });
  const patients = db.getRepository(Patient);
  const patient = await patients.save(patients.create({ firstName: 'Paciente', lastName: 'Sintetico QA', birthDate: '2000-01-01' }));
  const orders = db.getRepository(ServiceOrder);
  for (const row of [
    { folio: 'QA-OCT-001', subtotalAmount: 120, discountAmount: 0, totalAmount: 120, status: ServiceStatus.COMPLETED },
    { folio: 'QA-OCT-002', subtotalAmount: 20, discountAmount: 4.50, totalAmount: 15.50, status: ServiceStatus.PENDING },
    { folio: 'QA-OCT-003', subtotalAmount: 45, discountAmount: 0, totalAmount: 45, status: ServiceStatus.CANCELLED },
  ]) await orders.save(orders.create({ ...row, patientId: patient.id, branchName: 'Sucursal QA', isActive: true }));
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City',
    year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const base = 'http://127.0.0.1:3109/api';
  const login = await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'octubre@example.test', password: process.env.SECURITY_QA_UI_PASSWORD, mobile: true }) });
  assert.equal(login.status, 201);
  const session = await login.json();
  const response = await fetch(`${base}/cash-cuts?fromDate=${today}&toDate=${today}&limit=20&page=1`,
    { headers: { Authorization: `Bearer ${session.token}` } });
  assert.equal(response.status, 200);
  const report = await response.json();
  assert.equal(report.summary.totalAmount, '135.50');
  assert.equal(report.summary.serviceCount, 2);
  assert.equal(report.summary.cancelledCount, 1);
  assert.equal(report.summary.cancelledAmount, '45.00');
  writeFileSync('reports/october/fixture.json', JSON.stringify({ synthetic: true, today,
    backend: 'real NestJS modules and PostgreSQL; no mocked HTTP responses',
    expected: report.summary }, null, 2));
  const tls = createServer({ cert: readFileSync(process.env.SECURITY_QA_TLS_CERT),
    key: readFileSync(process.env.SECURITY_QA_TLS_KEY) }, app.getHttpAdapter().getInstance());
  await new Promise(resolve => tls.listen(3110, '0.0.0.0', resolve));
  writeFileSync('reports/october/ready', today);
  await new Promise(resolve => process.once('SIGTERM', resolve));
  await new Promise(resolve => tls.close(resolve));
  await app.close();
}
run().catch(error => { process.stderr.write(`October fixture failed: ${error.name}: ${error.message}\n`); process.exitCode = 1; });
