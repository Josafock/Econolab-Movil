# Seguimiento de las correcciones A4

## ADB offline en aceptación

- Evidencia inicial: run 40142877531 del 24 de octubre.
- Observado: Maestro no pudo lanzar la app; ADB informó `device offline`.
- Tratamiento: esperar arranque, conexión y Package Manager estables; conservar
  diagnóstico y no reintentar aserciones funcionales para convertirlas en éxito.
- Resultado de repetición: se registra desde el run nativo terminado; no se
  acredita por disponer del script.

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
- Repetición: se documenta desde los JUnit Debug/Release del nuevo run terminado.

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
