# Correcciones de integración continua de Econolab

Revisión del 26 de octubre de 2026 para la actividad A4. Base funcional:
`fix/HU-08-seguridad-rubrica`, versión 1.1.0. `main` contiene únicamente la
integración de HU01; la existencia de una función en esta rama no acredita su
integración o aceptación en el tablero. No se modifican issues ni Project.

## Observaciones atendidas

| Observación | Implementación y verificación |
|---|---|
| Falta estrategia de versiones | `docs/VERSIONAMIENTO.md`, `ci/release-policy.json` y `scripts/ci/version.cjs`; versión de app/package consistente y etiqueta validada. |
| Integrar datos de prueba | `tests/fixtures/config.json` consumido por Jest; el backend aislado crea cuentas y catálogo QA propios antes de integración, k6 y aceptación. |
| Identificar los tipos de prueba en YAML | Comentarios TIPO y nombres explícitos en pipeline, seguridad, aceptación nativa y liberación. |
| APK y despliegue después de pruebas | `release.yml` exige validación completa y aceptación nativa; EAS crea APK/AAB y la opción explícita de envío usa la pista interna de Play. |
| Atender resultados de GitHub | El fallo nativo previo fue `device offline`; se espera ADB, arranque y Package Manager estables. Los errores funcionales no se convierten en éxito mediante reintentos. |
| Actuar ante fallos | El check final considera seguridad, calidad, bundles y aceptación nativa requerida. Un fallo/cancelación bloquea el resultado. |
| Reducir artifacts | Una regresión Jest por ejecución, evidencia por HU derivada de ese resultado y cuatro artifacts habituales: SAST, integración/carga, transferencia de regresión y reporte final. Los intermedios duran un día. |
| Coincidir con herramientas planeadas | GitHub Actions, Jest/RNTL, ESLint, Prettier, Appium y k6 configurados. SonarCloud requiere vinculación externa; Firebase Test Lab requiere proyecto/cuenta y se registra como pendiente. Maestro se conserva como evidencia complementaria. |

## Flujo de verificación

La regla de protección de `main` exige ahora `pipeline / CI obligatorio PR` y
`pipeline / native / android`, vinculados a la app GitHub Actions, con rama
actualizada y aplicación a administradores. Una rama que aún conserve el CI
anterior debe incorporar estos workflows para obtener ambos resultados. La
corrección se prepara sobre HU08; no integra automáticamente la aplicación en
`main` ni modifica las historias del tablero.

1. `plan`: identifica HUs, tareas y archivos; transmite el plan como output de
   texto JSON sin crear otro artifact.
2. `quality`: instala con lockfile, verifica versionamiento, Prettier, ESLint y
   TypeScript, ejecuta Jest completo con cobertura y relaciona cada HU con los
   resultados existentes. Una suite requerida ausente impide aprobar esa HU.
3. `security`: Semgrep y auditoría; backend NestJS real fijado por commit y
   PostgreSQL 17.6 desechable, 16 contratos HTTP, k6 y ZAP. Ninguna carga llega a
   Render ni a la base operativa.
4. `build`: verifica exportaciones Android/iOS/web. No se distribuyen tres
   bundles redundantes; no se presentan como APK.
5. `native`: obligatorio para PR, main y liberación; compila APK Debug/Release,
   prueba pinning y ejecuta Appium y Maestro en Android API 35. Un push aislado
   ejecuta la validación rápida; la ejecución manual permite solicitar nativo.
   Se retiró el antiguo disparador adicional por push de HU08: la llamada se
   centraliza en este pipeline y conserva la ejecución manual independiente.
6. `report`: se intenta incluso ante fallo y conserva diagnóstico, JSON Jest,
   cobertura, resultados de integración y las métricas k6. El artifact final
   `reporte-seguimiento` contiene la carpeta `final` con el informe y plantilla.
   Los logs de runners y el artifact nativo complementan esa evidencia.

## Entorno y parámetros

Node 24; npm ci; Expo 57; React Native 0.86; Jest 29.7; Ubuntu 24.04;
PostgreSQL 17.6; Semgrep 1.182.1; ZAP 2.17.0; k6 2.3.0; Appium 3.8.0;
UiAutomator2 8.7.1; Maestro 2.11.0; Android API 35 y arquitectura x86_64 para QA.
Las versiones efectivas y sus resultados se comprueban en los logs.

Las pruebas TLS dependen de certificados y servidores nuevos en cada ejecución.
Su tarea Gradle utiliza `live-tls.init.gradle`: no reutiliza ni almacena
resultados de prueba, aunque conserva cachés del compilador. El verificador
`check-native-tls.py` bloquea resultados omitidos o de caché, casos obligatorios
ausentes y un JUnit anterior al inicio del build actual.

La base exige `NODE_ENV=test`, host loopback y nombre terminado en `_test`.
JWT, contraseña de PostgreSQL y contraseña de usuario QA se generan en cada
ejecución y se ocultan antes de subir evidencias. Los usuarios terminan en
`example.test`; el catálogo ficticio solo existe dentro del entorno de prueba.

## Rendimiento y esfuerzo

Los objetivos de `ci/service-objectives.json` son propuestas de ingeniería
para QA; no son un SLA firmado por el laboratorio.

| Escenario | Carga y duración | Umbral |
|---|---|---|
| Línea base | 1 VU durante 20 s | p95 menor de 800 ms, errores como máximo 1% |
| Carga | 5 VUs durante 30 s | Igual objetivo; comparación con línea base |
| Esfuerzo | 10, 25 y 50 VUs en rampas de 15 s, sostener 20 s y bajar 15 s | p95 menor de 1500 ms, errores como máximo 2% |
| Recuperación | 1 VU durante 15 s después del esfuerzo | p95 menor de 800 ms, cero errores |

La comparación exige p95 de carga menor o igual a
`max(800 ms, 3 × p95 de la línea base)`. No se afirma haber encontrado el punto
de saturación si no se alcanzó. La prueba acota la carga máxima a 50 usuarios.
Sus resultados no miden RAM, batería, renderizado móvil o disponibilidad de
producción. Estos requieren pruebas de dispositivo y monitoreo operativo.

## Publicación y servicios externos

`release.yml` valida que el commit pertenezca a main, comprueba el tag SemVer,
ejecuta la validación completa y después solicita las compilaciones firmadas a
EAS. El APK sirve para instalación directa; Google Play recibe el AAB.
`workflow_dispatch.submit=true` permite enviar ese mismo AAB a la pista interna,
con el environment `google-play-internal`. No se publica automáticamente en
producción.

Se requieren `EXPO_TOKEN` y, para el envío, `GOOGLE_PLAY_SERVICE_ACCOUNT` en
GitHub Secrets. La clave temporal se retira al terminar; no se sube como
artifact. Una falta de credenciales causa error y no se registra como envío.
Las cuentas, acuerdos, ficha, seguridad de datos y permisos de Play pertenecen
al titular. Preparar el workflow no acredita que Google haya publicado la app.

`sonar.yml` y `sonar-project.properties` preparan SonarCloud con cobertura LCOV
y espera de Quality Gate. Requieren `SONAR_TOKEN`, `SONAR_PROJECT_KEY` y
`SONAR_ORGANIZATION`; sin vinculación la ejecución solicitada falla. No se
presenta Semgrep como si fuera un resultado de SonarCloud.

## Seguimiento de resultados

Una prueba fallida se analiza desde la primera etapa que falló. Se conserva el
run inicial, causa demostrada, corrección, commit y run de repetición en
`seguimiento.md`. Un error del emulador se identifica como infraestructura;
no demuestra por sí mismo un defecto funcional. El resultado final requiere
revisar JUnit, capturas y ambos builds; una compilación correcta no acredita
la aceptación completa.

Los ocho avisos de dependencias observados localmente (cinco altos y tres
moderados) siguen registrados; no se cambiaron a versiones incompatibles para
ocultarlos. El bloqueo de auditoría mantiene cero hallazgos críticos como umbral.
Los avisos restantes requieren análisis y actualización compatible.

La correspondencia con DeepWiki y los módulos actuales está en
[DEEPWIKI.md](DEEPWIKI.md). El documento académico identifica evidencia actual,
evidencia histórica y servicios aún pendientes por separado.
