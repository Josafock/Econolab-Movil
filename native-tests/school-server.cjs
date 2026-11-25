// Copied to the pinned backend's test directory; runs only against a disposable database.
require('reflect-metadata');
const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { createServer } = require('node:https');
const { randomBytes } = require('node:crypto');
const { Module, ValidationPipe } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { ConfigModule } = require('@nestjs/config');
const { TypeOrmModule } = require('@nestjs/typeorm');
const { DataSource } = require('typeorm');
const { AuthModule } = require('../src/auth/auth.module');
const { UsersModule } = require('../src/users/users.module');
const { PrivacyModule } = require('../src/privacy/privacy.module');
const { SecurityModule } = require('../src/security/security.module');
const { SchoolModule } = require('../src/school/school.module');
const { User } = require('../src/users/entities/user.entity');
const { Role } = require('../src/common/enums/roles.enum');
const { hashPassword } = require('../src/common/utils/crypto.util');
const { SecurityService } = require('../src/security/security.service');

if (!['127.0.0.1', 'localhost', '::1'].includes(process.env.DATABASE_HOST ?? '') ||
    !process.env.DATABASE_NAME?.endsWith('_test') || process.env.NODE_ENV !== 'test' ||
    !process.env.SECURITY_QA_UI_PASSWORD || !process.env.SECURITY_QA_TLS_KEY || !process.env.JWT_SECRET) {
  throw new Error('Only a disposable local database, generated TLS and QA credentials are allowed.');
}
process.env.GOOGLE_CLIENT_ID = 'isolated-school-qa';
process.env.GOOGLE_CLIENT_SECRET = randomBytes(16).toString('hex');
process.env.GOOGLE_CALLBACK_URL = 'http://127.0.0.1:3109/api/auth/google/callback';
const database = { type: 'postgres', host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT), username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASS, database: process.env.DATABASE_NAME };
class SchoolNativeTestModule {}
Module({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
  TypeOrmModule.forRoot({ ...database, autoLoadEntities: true, synchronize: true }),
  AuthModule, UsersModule, PrivacyModule, SecurityModule, SchoolModule,
] })(SchoolNativeTestModule);

async function run() {
  mkdirSync('reports/school-native', { recursive: true });
  const bootstrap = await new DataSource(database).initialize();
  try { await bootstrap.query('CREATE SCHEMA IF NOT EXISTS operativo'); }
  finally { await bootstrap.destroy(); }
  const app = await NestFactory.create(SchoolNativeTestModule, { logger: ['error'], abortOnError: false });
  const requests = [];
  app.use((req, res, next) => {
    res.on('finish', () => requests.push({ method: req.method, route: req.path, status: res.statusCode }));
    next();
  });
  app.use(require('helmet')(app.get(SecurityService).buildHelmetConfig()));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true,
    transformOptions: { enableImplicitConversion: true } }));
  app.setGlobalPrefix('api');
  await app.listen(3109, '127.0.0.1');
  const users = app.get(DataSource).getRepository(User);
  for (const email of ['native-debug@example.test', 'native-release@example.test', 'fixture-owner@example.test']) {
    await users.save(users.create({ nombre: 'Equipo QA', email, confirmed: true, rol: Role.Admin,
      password: await hashPassword(process.env.SECURITY_QA_UI_PASSWORD) }));
  }
  const tlsServer = createServer({ cert: readFileSync(process.env.SECURITY_QA_TLS_CERT),
    key: readFileSync(process.env.SECURITY_QA_TLS_KEY) }, app.getHttpAdapter().getInstance());
  await new Promise(resolve => tlsServer.listen(3110, '0.0.0.0', resolve));
  writeFileSync('reports/school-native/ready', 'isolated-school-native');
  try { await new Promise(resolve => process.once('SIGTERM', resolve)); }
  finally {
    writeFileSync('reports/school-native/fixture.json', JSON.stringify({
      executedAt: new Date().toISOString(), database: 'disposable PostgreSQL fixture',
      backend: 'real NestJS auth/profile/privacy/school modules', productionContacted: false,
      requests,
    }, null, 2));
    await new Promise(resolve => tlsServer.close(resolve));
    await app.close();
  }
}
run().catch(error => { process.stderr.write(error.stack + '\n'); process.exitCode = 1; });
