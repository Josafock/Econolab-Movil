# CI/CD personalizado de Econolab

> Actualización A4 del 26 de octubre de 2026: la configuración vigente de esta
> rama reduce la duplicación de suites y artifacts, exige aceptación nativa en
> PR/main y agrega rendimiento, esfuerzo y liberación Android. Consulta
> [la configuración y evidencia actuales](CI_CORRECCIONES_A4.md) y
> [versionamiento](VERSIONAMIENTO.md). Las descripciones de matriz y artifacts
> siguientes se conservan como historial de la primera configuración.

## Cuándo se ejecuta

| Archivo | Evento | Resultado |
|---|---|---|
| `.github/workflows/ci.yml` | Push a ramas de trabajo; PR abierto, actualizado, reabierto o editado hacia main/develop | Regresión disponible, checks de las HUs afectadas y exportación |
| `.github/workflows/main.yml` | Push a main, incluido el generado por un merge | Regresión completa, todas las HUs implementadas y entrega de artifacts |
| `.github/workflows/pipeline.yml` | Llamado por los dos workflows anteriores | Implementación común de selección, calidad, pruebas y builds |
| `.github/workflows/integration.yml` | Después de que Main CI y entrega termine correctamente; también manual en main | Integración con backend si están disponibles el código y sus secrets |

GitHub genera un evento push al integrar un PR en main. Por eso el merge dispara
`main.yml` sin añadir otra ejecución duplicada mediante `pull_request: closed`.
Un PR cerrado sin merge no dispara la entrega de main. Push y PR tienen grupos
de concurrencia separados: ambos conservan su validación y las actualizaciones
de la misma referencia cancelan ejecuciones anteriores.

## Personalización por issue

La relación está versionada en `ci/features.json`; no requiere consultar ni
modificar el Project durante CI. Los identificadores corresponden a las issues
existentes del repo; HU-05 es **#6**, no la issue duplicada PB-05 #5.

| HU | Issue y tareas | Alcance y suites específicas |
|---|---|---|
| HU-01 | #1; #10–#14 | Configuración y API: config/api |
| HU-02 | #2; #15–#18 | Interfaz y navegación: ui; prebuild de Android/iOS |
| HU-03 | #3; #19–#21 | Login, logout, almacenamiento y sesión: auth-api/auth-session/auth-provider |
| HU-04 | #4; #22–#24 | Dashboard y acceso protegido: dashboard/auth-provider |
| HU-05 | #6; #25–#27 | Listado, búsqueda y detalle: studies |
| HU-06 | #7; #28–#29 | Perfil y contraseñas: profile/auth-provider |
| HU-07 | #8; #30–#32 | Validación, HTTP y red: api/auth-api/profile/studies |
| HU-08 | #9; #33–#38 | Todas las siete suites funcionales y de seguridad disponibles |

El selector combina el nombre de rama (`feature/HU-05-*`, `fix/HU-06-*`), las
referencias de issues/tareas del título y descripción del PR, y los archivos
modificados. Por ejemplo, cambiar el transporte HTTP selecciona HU-01 y HU-07.
Cambiar dependencias o el pipeline selecciona todas las HUs implementadas.
Los módulos se reconocen por archivos existentes, no por el estado del tablero.
Un checkout nuevo, historial inaccesible o un cambio de historia usa selección
completa para evitar perder comprobaciones. Los PR comparan contra su merge base.

## Etapas

1. **Plan**: calcula las HUs y conserva `plan.json`, con suites disponibles y
   pendientes. El resumen de Actions muestra issue y alcance.
2. **Calidad y regresión**: Node.js 24, `npm ci`, pruebas del selector y del bloqueo,
   ESLint, TypeScript y todas las suites Jest disponibles, con resultados JSON
   y cobertura LCOV/JSON. Un error o una prueba fallida impide la entrega.
3. **Checks por HU**: cada HU seleccionada ejecuta sus suites disponibles en un
   job identificado con HU, issue y nombre. Los resultados quedan separados.
4. **Build y entrega**: exportaciones Android, iOS y web. La validación de main
   y los cambios de interfaz/configuración también generan proyectos nativos
   con prebuild. Cada artifact incluye commit, versión y checksums SHA-256.
5. **Reporte y check final**: se ejecuta incluso si falla una etapa anterior.
   Reúne resultados de plan, calidad, todas las HUs y las tres exportaciones.
   Un fallo, cancelación o etapa obligatoria omitida hace fallar el check.
   Solo admite omitir la matriz de HUs si el plan aprobó y seleccionó cero HUs.

Los artifacts de evidencia y bundles duran 14 días y se descargan desde la ejecución, sección
**Artifacts**. Se guardan informes aun si falla una suite. Los bundles móviles
son JavaScript/Hermes y recursos: no son APK/AAB/IPA ni acreditan instalación o
pruebas físicas. Prebuild iOS se comprueba en el runner Linux; Expo no lo genera
desde Windows. La entrega automatizada aquí es de artifacts para revisión.

Los workflows usan Actions oficiales fijados por SHA, Ubuntu 24.04, caché de npm,
límites de tiempo y token de solo lectura. El contenido del PR se procesa como
datos en Node, sin interpolarlo como código de shell. Las pruebas de PR no
reciben credenciales del backend.

## Cobertura que todavía falta

Las ramas HU-01 a HU-07 contienen `config.test.ts`; el conjunto de autenticación,
perfil, estudios y errores está consolidado en HU-08. Las suites `ui.test.tsx` y
`dashboard.test.tsx` aún no existen. El pipeline lo registra como **pendiente**,
sin inventar casos ni declarar aceptación de la UI. También indica cuando la
plantilla inicial de main todavía no tiene Jest o módulos funcionales.

Un check verde acredita solo las validaciones y suites realmente ejecutadas.
No sustituye aceptación de usuario, pruebas de dispositivo ni una auditoría de
dependencias. La instalación de la base informó 32 alertas, incluida una crítica
de shell-quote que ya estaba en el lockfile inicial. No se aplicaron upgrades
forzados ni cambios de seguridad ajenos a esta configuración.

## Backend y entornos

La integración reutiliza `scripts/integration.cjs` de HU-08. Después de un CI
correcto de main comprueba acceso anónimo, login, perfil, paginación, filtros,
detalle y revocación. Ejecuta el mismo commit validado. Solo usa código de main
del propio repo, nunca código de un PR con secrets.

Necesita secrets **INTEGRATION_API_URL**, **INTEGRATION_EMAIL** y
**INTEGRATION_PASSWORD**, correspondientes a una cuenta de pruebas. Si faltan
el script o secrets, la ejecución automática registra integración pendiente;
una ejecución manual falla con la explicación de lo que falta. No se registra
una prueba contra el backend como aprobada cuando no se ejecutó.

Para que los bundles de entrega apunten a un backend, configurar la variable
pública **EXPO_PUBLIC_API_URL** en GitHub. Sin ella se exportan con
`https://example.invalid/api` y se conservan como evidencia técnica. Las pruebas
unitarias siempre usan ese endpoint inerte y sus mocks. Estas variables no son
credenciales. La publicación en tiendas mediante EAS/Google Play/App Store
requiere configurar su proyecto, firma y cuentas; no forma parte de estos
artifacts ni se simula como un despliegue exitoso.

## Reporte para documentar el seguimiento

En **Actions → ejecución → job CI obligatorio PR / Reporte CI → Summary** se
publica un informe legible. En **Artifacts** se descarga
`reporte-seguimiento-<run>-<intento>`, conservado durante 90 días, con:

- **reporte-ci.md**: resultado técnico, rama, PR, actor, fecha UTC, commits de la
  rama y del checkout probado, enlace a logs, HUs/issues, etapas, resultados de
  calidad, conteo global Jest, cobertura, errores y suites pendientes.
- **reporte-ci.json**: los mismos resultados estructurados para comparar runs
  o preparar otros reportes. No suma otra vez los casos repetidos por HU.
- **seguimiento.md**: plantilla para completar responsable, causa, impacto,
  corrección, nuevo commit/run, comparación antes/después, pruebas manuales,
  pendientes, fecha compromiso y criterio de cierre.

El informe se intenta generar aunque fallen las pruebas. Si falla la
infraestructura, el checkout o la recuperación de artifacts, puede faltar
evidencia: el check no lo transforma en aprobación. Para errores de instalación,
prebuild o exportación, consulta también los logs del job enlazado. Los logs de
ESLint/TypeScript y los errores Jest disponibles se incorporan al informe.

Si falla: documentar el primer fallo, analizar causa, corregir en la misma rama,
hacer push y añadir la nueva evidencia al seguimiento. Si pasa: revisar
pendientes y aceptación funcional; después del merge, registrar también el run
de main y, por separado, la integración real. No se crean ni modifican issues,
comentarios o tarjetas del Project.

## Bloqueo de main

La protección de `main` exige PR y el check de GitHub Actions
**CI obligatorio PR**, con la rama actualizada respecto a main. También se
aplica a administradores y prohíbe force push y borrado. No exige aprobación de
otra persona, para permitir trabajar al propietario individual.

El check final tiene un nombre exclusivo para PR; los pushes usan **Reporte CI**
y no pueden sustituir su aprobación. El nombre exacto que expone GitHub se
verifica al configurar la regla. El bloqueo requiere la configuración remota de
protección, además del YAML; no se activa por versionar este archivo.

Un fallo mantiene bloqueado el PR. Al corregir y hacer push se repite CI. Con
resultado aprobado se permite el merge, sujeto a conflictos y demás reglas;
no se hace merge automáticamente. El pipeline de main y la integración ocurren
después del merge y no revierten código automáticamente.

Las suites que aún no existen continúan como pendientes visibles: no se
declaran aprobadas y, por ahora, no son un requisito adicional de bloqueo. El
check exige que pasen las comprobaciones implementadas.

## Reproducir y mantener

```sh
npm ci --no-audit --no-fund
node --test tests/ci/*.test.cjs
npm run lint
npm run typecheck
node scripts/ci/run-tests.cjs all
node scripts/ci/run-tests.cjs HU-05
```

Editar `ci/features.json` al agregar suites o modificar la estructura del código.
Una prueba Jest presente que falla siempre devuelve error; no se usa
`--passWithNoTests`. Las pruebas del selector cubren mapeo de tareas, cambios
compartidos, ramas arbitrarias, historial ausente, merge base y contenido de PR.

La configuración de CI se integra en main y se sincroniza con las ramas de
features existentes conservando su código y pruebas. Al integrar una HU en main,
el workflow completo se ejecutará sobre la versión resultante. Los workflows no
cierran issues, no cambian sus responsables o etiquetas, ni mueven tarjetas del
Project. La protección remota y el check final se complementan para bloquear
el merge ante errores en las comprobaciones implementadas.
