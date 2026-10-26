# Seguimiento de las correcciones A4

## ADB offline en aceptación

- Evidencia inicial: run 40142877531 del 24 de octubre.
- Observado: Maestro no pudo lanzar la app; ADB informó `device offline`.
- Tratamiento: esperar arranque, conexión y Package Manager estables; conservar
  diagnóstico y no reintentar aserciones funcionales para convertirlas en éxito.
- Resultado de repetición: el run 40382607064 ejecutó tres recorridos Appium y
  un flujo Maestro por variante Debug/Release. Su JUnit TLS fue reutilizado,
  según la revisión de caché siguiente. El run 40409669602 cerró la validación
  completa con pruebas TLS nuevas y ambos recorridos nativos aprobados.

## Dependencia de Render en una prueba TLS

- Evidencia inicial: [run 40371704079](https://github.com/Josafock/Econolab-Movil/actions/runs/40371704079), commit 948403b.
- Observado: dos de tres pruebas TLS Java fallaron con SocketTimeoutException
  esperando cabeceras HTTP del servidor público. El rechazo de pin incorrecto
  sí pasó. El fallo se propagó a Gradle y al check final.
- Causa comprobada: las pruebas de pinning dependían también de recibir una
  respuesta HTTP de un servicio público; no era un entorno de prueba aislado.
- Corrección: dos certificados reales de claves distintas bajo una CA QA
  efímera, servidor local y cinco casos de conexión válida, respaldo de CA,
  rechazo de pin, rechazo de CA no confiable y verificación de hostname.
- Alcance: valida TLS y pinning en QA; no certifica disponibilidad ni renovación
  real del certificado de producción. No se agrega TrustAll ni se desactiva la
  comprobación de hostname.
- Validación posterior: el [run 40377741692](https://github.com/Josafock/Econolab-Movil/actions/runs/40377741692),
  commit cc1ca95, compiló Debug/Release y su JUnit registró cinco pruebas TLS,
  cero fallos, cero errores y cero omitidas. Appium aprobó tres recorridos.
  El resultado global permaneció rechazado por el fallo de Maestro siguiente.

## Campo oculto por el teclado al intentar acceder con la cuenta cancelada

- Evidencia: run 40377741692; Maestro Debug completó consentimiento existente,
  catálogo, precio, parámetro, preferencias y cancelación, pero no pudo localizar
  el campo de contraseña al intentar entrar otra vez.
- Causa comprobada: la captura del paso 75 muestra el teclado abierto y el campo
  fuera del área visible después de introducir el correo. No es evidencia de
  que el servidor haya permitido acceder a la cuenta cancelada.
- Corrección: ocultar el teclado y llevar a la vista el campo de contraseña y
  el botón de acceso. Se conserva la aserción de rechazo del usuario cancelado.
- Revisión adicional: la acción del emulador procesa cada línea como una
  invocación `sh -c`. La secuencia se trasladó a `native-acceptance.sh` con
  `set -euo pipefail` para conservar una sesión, bucles y códigos de error.
- Repetición: [run 40382607064](https://github.com/Josafock/Econolab-Movil/actions/runs/40382607064),
  commit 14c0dcc7f514c6885c8edc8bc67bb8afee19bdf1, terminó aprobado. Sus dos
  JUnit Maestro registran un flujo por variante y cero fallos. Las capturas y
  el flujo terminado conservan la comprobación de rechazo del usuario cancelado.

## Resultado completo previo y revisión de caché

El run 40382607064 concluyó con todos los jobs y el check final aprobados:
181 pruebas Jest en 18 suites, 27 comprobaciones del pipeline, 16 casos HTTP,
Semgrep sin hallazgos, cuatro escenarios k6, tres exportaciones y aceptación
nativa. Sus cinco artifacts incluyen el reporte consolidado y la evidencia
Android. El resultado detallado está en `ci-completo-40382607064.json`.

El log de Gradle mostró `testReleaseUnitTest FROM-CACHE`. Su JUnit TLS conserva
la fecha 18:42:24 del run 40377741692. Los recorridos Appium y Maestro sí se
ejecutaron en 40382607064, pero ese resultado no acredita nuevas conexiones TLS
contra el certificado efímero generado en 40382607064.

Se añadió `live-tls.init.gradle` para impedir la reutilización y escritura en
caché del resultado de la tarea TLS, conservando las cachés de compilación.
`check-native-tls.py` exige cinco casos obligatorios, cero fallos/omisiones y un
JUnit posterior al inicio del build actual. Se probó contra el artifact de
40382607064 y lo rechazó por contener `FROM-CACHE`. La repetición
[40409669602](https://github.com/Josafock/Econolab-Movil/actions/runs/40409669602)
cerró esta observación: inicio 22:11:25 UTC, JUnit 22:18:44.516 UTC y verificación
`passed=true`, `cached=false`, cinco casos y cero fallos/omisiones. La fecha y
el commit 54128a6 constan en `ci-completo-40409669602.json`.

El resultado acredita ese commit de QA con el límite de caché descrito, no una publicación en Play, un análisis
de SonarCloud ni un ensayo de Firebase. Los avisos de dependencias continúan
visibles y el acuerdo operativo de niveles de servicio sigue pendiente.

## Pérdida de ADB durante la captura y repetición parcial

El [run 40391909453, intento 1](https://github.com/Josafock/Econolab-Movil/actions/runs/40391909453/attempts/1)
ejecutó y verificó cinco casos TLS nuevos sin caché. Durante Appium, después de
comprobar que el consentimiento inicial estaba desmarcado, `GET /screenshot`
perdió su conexión con UiAutomator2. El driver y ADB informaron `device offline`.
No se completaron los recorridos ni se ejecutó Maestro. El check final rechazó
el intento por `native: failure`; el resumen está en
`ci-rechazado-40391909453-intento1.json`.

La repetición del intento 2 se canceló al preparar una ejecución del commit
df045f1, que también corrige la recopilación de evidencia en repeticiones
parciales. El reporte selecciona el artifact de mayor intento por categoría,
limitado al mismo run y a intentos no posteriores al actual. Conserva el nombre
de origen y bloquea la aprobación si falta un artifact obligatorio. Dos nuevos
casos prueban la selección numérica, el rechazo de evidencia de otra ejecución
y la ausencia de datos.

El run rápido 40396061406 detectó otro error de recopilación: la versión fijada
de `download-artifact` v8 extrae un único artifact directamente en el destino.
El selector esperaba su subcarpeta y rechazó el resultado por falta de
`regression`, sin declarar falsamente pruebas aprobadas. El commit 289a4a0
descarga juntos los tres grupos de evidencia obligatorios para conservar sus
carpetas. Si falta un grupo se conserva el rechazo. Un caso adicional ejecuta
el proceso real del reporte con datos de distintos intentos y luego retira un
artifact obligatorio para comprobar el bloqueo. Las comprobaciones del pipeline
suman ahora 30 casos. El run rápido 40397290436 y la repetición completa
40409669602 aprobaron la recuperación y el reporte con los tres artifacts de
origen identificados; sus resúmenes quedan versionados en esta carpeta.

Las repeticiones parciales requieren que los artifacts intermedios del mismo
run sigan disponibles. Su retención es de un día. Después de expirar se repite
el workflow completo; no se sustituye su evidencia con archivos de otro run o
commit. El informe consolidado se conserva durante 90 días.

## Captura reproducible sin el endpoint de UiAutomator2

El [run 40397290225](https://github.com/Josafock/Econolab-Movil/actions/runs/40397290225)
repitió el fallo del intento 1 de 40391909453 exactamente en `GET /screenshot`.
Ambos habían localizado el consentimiento inicial y comprobado `checked=false`.
El endpoint devolvió `socket hang up`; terminaron la instrumentación y la
conexión ADB. No hay evidencia de un fallo de la aserción de consentimiento,
pero tampoco se acredita el recorrido completo. El check final rechazó ambos.
En 40397290225 las cinco pruebas TLS sí fueron nuevas y verificadas sin caché.

El commit 54128a6 obtiene las imágenes del mismo emulador mediante
`adb exec-out screencap -p`, documentado por Android Developers. Exige salida
correcta, tiempo máximo y cabecera PNG válida; una captura fallida sigue
rechazando el caso. Appium mantiene todos los controles y aserciones, sin
reintentar recorridos funcionales. Se conserva además el buffer de errores
Android para diagnóstico, con la redacción de credenciales aplicada al subirlo.
La repetición completa 40409669602 aprobó cinco casos TLS nuevos, tres casos
Appium y un flujo Maestro por variante, con cero fallos. Release se ejecutó con
Metro detenido. Las capturas reales de consentimiento y detalle y los JUnit se
revisaron junto con `captureTool=adb exec-out screencap -p`. El reporte final
registró `approved=true`, todos los jobs obligatorios en `success` y ninguna
entrada en `failures`. Esto cierra la incidencia de captura para ese commit de
QA; no acredita todos los dispositivos ni una publicación en Play.

## Servicios externos

El equipo confirmó que todavía no dispone de cuentas de Play Console, Firebase
y SonarCloud. Los workflows y parámetros de publicación/SonarCloud son
preparación, no resultados ejecutados ni publicación de tienda. DeepWiki mostró
inicialmente que faltaba indexar. Después de la autorización del titular y su
verificación humana, se publicó el índice de 22 páginas; la comparación con la
corrección A4 está en `docs/DEEPWIKI.md`.

## Avisos de dependencias

La auditoría registra ocho paquetes afectados por tres avisos, incluyendo
paquetes que heredan el riesgo de una dependencia. No son ocho vulnerabilidades
independientes. No se ejecutó `npm audit fix --force`: propone cambiar de versión
mayor de Expo/Router, incluso retroceder a Expo 54, fuera de la plataforma 57.

| Dependencia observada | Aviso y tratamiento pendiente |
|---|---|
| `node-forge@1.4.0`, mediante Expo CLI | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). El aviso no publica una versión corregida al revisar. Seguir el arreglo del proveedor de Expo/forge y volver a validar firma y compilación; no se declara resuelto. |
| `zod@3.25.76`, anidado en Expo CLI | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). El arreglo indicado es 4.6.6; la app ya usa 4.6.7, pero forzar Zod 4 en un consumidor de Zod 3 exige verificar compatibilidad del CLI. |
| `decode-uri-component@0.2.2`, mediante Router/query-string | [GHSA-vcc3-ghjq-m6fr](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr). El arreglo indicado es 0.5.0; revisar actualización compatible del consumidor y recorridos de navegación/URL antes de promoverla. |

El umbral del pipeline conserva el bloqueo por criticidad y muestra los avisos
altos y moderados. Que el check apruebe no acredita que esos riesgos hayan sido
eliminados. Una actualización requiere auditoría, regresión, exportación y
aceptación nativa nuevas; el equipo debe revisar estos pendientes antes de una
distribución operativa.
