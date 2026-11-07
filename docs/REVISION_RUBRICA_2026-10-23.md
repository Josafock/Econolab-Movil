# Revisión de ECONOLAB móvil frente a la rúbrica

> **Diagnóstico previo a la implementación 1.1.** Este documento conserva los hallazgos que originaron el trabajo posterior. Consultar [seguridad y privacidad de la versión 1.1](SEGURIDAD_Y_PRIVACIDAD.md) y los resultados de sus PR/Actions para distinguir pendientes implementados de comprobaciones todavía en ejecución.

Fecha: **23 de octubre de 2026**, Ciudad de México. Revisión técnica del proyecto y de las evidencias disponibles; la calificación y aceptación de equivalencias corresponden al docente.

**Resultado: la aplicación tiene funciones y pruebas comprobadas, pero todavía no cumple todos los requisitos de la rúbrica.** Los pendientes principales son arquitectura y patrones explícitos, análisis SAST/DAST, certificate pinning, renovación de sesión, derechos ARCO completos, R8 y su análisis, pruebas nativas Debug/Release y publicación en Google Play.

Se tomó como instrumento de evaluación el PDF de tres páginas proporcionado por el alumno. Sus criterios se compararon con el proyecto; no se trataron como autorización para cambiar la planeación, borrar información o publicar la app.

## Alcance y versión revisada

- Repositorio: [Josafock/Econolab-Movil](https://github.com/Josafock/Econolab-Movil).
- Rama local: `fix/HU-08-publicacion-play-store`, commit `52ee458946f5a07e8ce2388a56e2518614cdc0ca`.
- [PR57](https://github.com/Josafock/Econolab-Movil/pull/57): abierto, integrable y con 28 checks aprobados al consultar GitHub. No se fusionó.
- `main` remoto: `bbd004feff479ce09b022c9d9e2b0a7b5c523711`. Ya tiene integraciones del propietario; los documentos de principios de octubre que dicen que conserva únicamente el commit inicial son históricos.
- Backend utilizado: `https://backend-econolab-escuela-1.onrender.com/api`. Se reutilizó el existente; no se creó otro backend ni otra base.
- Se conservaron los cambios locales previos de `app.json`, incluidos los datos de vinculación con Expo.
- En esta revisión se añadieron documentos de evaluación y formatos de evidencia. **No se implementaron los pendientes de código, no se cambiaron Sprints y no se publicó una nueva versión de la app.**

La PWA y la app móvil son productos distintos: el caché público y el buscador QR de la web no prueban que esas funciones estén implementadas en Android. El módulo móvil de Cortes conserva el alcance acordado: **resumen de servicios por fecha**, sin presentarlo como dinero efectivamente cobrado, abonos o retiros.

## Revisión de los 15 criterios

“Cumple” indica evidencia técnica suficiente en el alcance comprobado; “Parcial” indica una parte implementada o evidencia incompleta; “Pendiente” indica ausencia de la implementación o de la evidencia obligatoria. No son puntos asignados ni una certificación de seguridad.

| Criterio | Valor | Estado | Evidencia y faltante concreto |
| --- | ---: | --- | --- |
| A5.1 Versionamiento | 1 | Parcial | Existen `main`, ramas `feature/*`, correcciones `fix/*`, commits y PR. No apareció `develop` en las ramas remotas consultadas, aunque la rúbrica la pide expresamente. Acordar la estrategia con docente y equipo antes de alterar el flujo oficial. |
| A5.2 SAST/DAST en CI | 1 | Pendiente | Hay workflows de lint, tipos, pruebas y compilación, pero no se encontró Semgrep, SonarQube, Snyk o MobSF analizando el móvil ni un informe DAST. `npm audit` es análisis de dependencias y no sustituye esos controles. |
| A5.3 Estructura y aportes del equipo | 1 | Parcial | Hay organización por funcionalidades y commits de dos identidades de Git. Eso no acredita aportaciones equilibradas de todos los integrantes; faltan la relación de integrantes y evidencias de su trabajo real. |
| A4.1 Interfaces móviles | 2 | Cumple | React Native, Expo y TypeScript; acceso, inicio, estudios, detalle, perfil, ayuda y Cortes. Hay APK construido y el usuario confirmó que funcionó. Para la entrega, adjuntar capturas del teléfono. |
| A4.2 Arquitectura y cuatro patrones | 2 | Parcial | Existe separación `core/features/ui`; `api` compartida, fábrica `createSession` y suscripciones de React Context. No se encontró una capa Repository explícita ni un diseño MVVM/Clean completo con los cuatro patrones documentados y aplicados. |
| A4.3 Caja blanca | 1.5 | Cumple en lógica comprobada | 147 pruebas en 12 suites, más 21 pruebas de configuración/CI, y 8 comprobaciones contra Render. Los archivos están en `/tests`, no en el `/test` literal del instrumento; confirmar equivalencia con el docente. La cobertura no es total. |
| A4.4 Navegación y UX/UI | 1.5 | Parcial | Navegación, formularios, estados de carga/error y pruebas de componentes. Hay revisiones anteriores en navegador, pero falta una batería documentada en Android: teclado, botón Atrás, fuentes grandes, accesibilidad y recuperación de red en Debug y Release. |
| A6.1 Cloud y JWT | 1.5 | Parcial | API real HTTPS, Bearer, consulta protegida, login, perfil, estudios, Cortes y revocación probados. Ante 401 se invalida la sesión; falta el interceptor de renovación exigido en los requisitos generales. El backend de autenticación de la app no expone actualmente un contrato de refresh. |
| A6.2 Anti-MitM y cifrado local | 1.5 | Parcial | SecureStore nativo protege la sesión mediante Android Keystore/iOS Keychain. El cliente usa `fetch` y no configura pins SHA-256. HTTPS por sí solo no acredita certificate pinning. |
| A6.3 Derechos ARCO | 1.5 | Parcial | Consultar y editar nombre/correo funciona mediante `GET/PATCH /api/users/me`. Faltan aviso público configurado, consentimiento explícito inicialmente desmarcado, cancelación propia y opciones de oposición persistidas. El borrado administrativo de otro usuario no satisface la cancelación del titular. |
| A6.4 R8/ProGuard y análisis | 1.5 | Pendiente | El build real ejecutó `assembleRelease` y `mergeDexRelease`, sin tarea `minifyReleaseWithR8`. No se encontró configuración persistente que active minificación y reducción de recursos. Tampoco hay reporte de JADX/MobSF. “Release” no significa automáticamente “ofuscado”. |
| A6.5 Caja negra Debug/Release | 2 | Parcial | Hay pruebas automatizadas y verificaciones anteriores de navegador. Falta ejecutar la misma matriz funcional sobre builds nativos Debug y Release, con resultados, incidencias, correcciones y repetición sobre Release. Se entrega un formato vacío, sin inventar aprobaciones. |
| A7.1 Publicación Play Store | 1 | Pendiente | Existe distribución por Expo, pero no evidencia de una ficha publicada o de un envío activo a revisión en Google Play Console. Un borrador, el enlace del APK o un QR de Expo no acreditan ese estado. |
| A7.2 Paquete firmado e instalable | 0.5 | Cumple | APK 1.0.0 construido con EAS, paquete `com.econolab.mobile`, bloque de firma Android v2 presente e instalación reportada por el usuario. Se incluye su identificación abajo. No se ejecutó `apksigner verify` localmente. |
| A7.3 Permisos justificados | 0.5 | Parcial | El manifiesto real no solicita permisos peligrosos de cámara, micrófono, ubicación o almacenamiento externo. Se debe documentar para qué sirve cada permiso incluido y comprobar la experiencia en el teléfono. Los permisos normales no presentan el diálogo de autorización de Android. No agregar permisos innecesarios para producir una captura. |

La rúbrica suma 20 puntos y transforma el resultado a una escala de 10. **No se asigna una calificación estimada:** varios criterios mezclan implementación, demostración y aceptación del docente.

## Pruebas y verificaciones realizadas el 23 de octubre

| Comprobación | Resultado | Límite de la evidencia |
| --- | --- | --- |
| `npm run lint` | Aprobado | Análisis de estilo y reglas; no es SAST/DAST. |
| `npm run typecheck` | Aprobado | Verificación estática de TypeScript. |
| `npm test -- --runInBand --coverage` | 147 pruebas, 12 suites aprobadas | Caja blanca de código y componentes; no es ejecución nativa E2E. |
| `node --test tests/ci/*.test.cjs` | 21 pruebas aprobadas | Configuración, planeación del CI y preparación de publicación. |
| `npm run test:integration` | 8 comprobaciones aprobadas contra Render al repetir la ejecución | La primera ejecución falló; después se comprobó el rechazo anónimo 401 y pasó la suite completa. No se determinó la causa exacta del fallo inicial. No se modificaron datos del negocio. |
| PR57 en GitHub | 28 checks aprobados | No significa que se hayan ejecutado SAST, DAST ni la integración remota con secrets. |
| `npm audit --json` | 8 alertas: 5 altas, 3 moderadas, 0 críticas | Conteo de paquetes afectados, no ocho vulnerabilidades independientes ni ocho ataques demostrados. |
| APK publicado en EAS | Descargado e inspeccionado | Manifiesto, versión, permisos y presencia de firma. No sustituye JADX/MobSF, DAST ni la matriz física. |

Cobertura de Jest sobre los archivos incluidos de `src/core` y `src/features`: **62.05 % sentencias, 53.02 % ramas, 55 % funciones y 63.95 % líneas**. No representa todos los archivos de la app. `AboutScreen`, `ProfileCard`, `StudiesScreen` y `StudyDetailScreen` no tuvieron cobertura de líneas en esa ejecución, aunque existen pruebas de sus contratos de API. La rúbrica no establece un porcentaje mínimo: no se inventó uno.

La integración comprueba: rechazo del acceso anónimo, login, perfil, Cortes con rol autorizado, catálogo/paginación, búsqueda/filtros, detalle y logout con token revocado. Las credenciales están en un archivo local ignorado por Git y no forman parte de las evidencias públicas.

### Dependencias y CI de integración

El resultado actual de auditoría difiere del registro histórico de 57 alertas. **No se cambiaron dependencias en esta revisión**; no se presenta la diferencia como una reparación del código.

- `zod@4.6.5` tiene un aviso de severidad alta y parche publicado en `4.6.6`. Es candidato a actualización compatible que debe probarse e incorporarse por PR. [Aviso oficial GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- Persisten avisos de `node-forge` en herramientas de certificados/Expo y de `decode-uri-component` en la cadena de navegación, además de sus consumidores transitivos. No se demostró explotación en el proyecto.
- No aplicar `npm audit fix --force`: la simulación propone cambios de plataforma incompatibles. Resolver con versiones compatibles y pruebas; conservar un registro de cualquier excepción.
- `gh secret list` no devolvió secrets del repositorio. El workflow de integración requiere `INTEGRATION_API_URL`, `INTEGRATION_EMAIL` e `INTEGRATION_PASSWORD`; deben ser una cuenta de pruebas con permisos suficientes para los casos de Cortes, nunca una cuenta personal del laboratorio.
- En `.github/workflows/integration.yml`, la ejecución automática posterior a `main` puede terminar sin error y **saltar** los pasos de integración cuando falta configuración. El resumen lo indica. La ejecución manual falla si falta configuración. Por eso, un check verde no acredita por sí mismo conexión real.
- El workflow actual admite la finalización del CI de `main` y ejecución manual sobre `main`; no tiene disparador por tags de cierre de Sprint. Hay que resolverlo con el flujo y las tareas existentes, sin inventar cierres.
- La consulta de protección de `main` devolvió 404. Ese resultado no permite distinguir con certeza entre ausencia de protección y permisos insuficientes; el propietario debe revisar Settings → Branches/Rulesets.

## Identificación del APK revisado

[Build EAS finalizado](https://expo.dev/accounts/dravix117/projects/econolab-mobile/builds/06c67278-65e2-4809-b5c7-003b4aaa9f82) · [Descargar APK](https://expo.dev/artifacts/eas/dnv_PNgUTDBRjWujo9y-EKMu5yR7vKmIJwHcPL0WBqA.apk)

| Dato | Resultado |
| --- | --- |
| Build | `06c67278-65e2-4809-b5c7-003b4aaa9f82` |
| Commit informado por EAS | `52ee458` |
| Versión / código | `1.0.0` / `1` |
| Application ID | `com.econolab.mobile` |
| Android mínimo / objetivo | API 24 / API 36 |
| Tamaño | 112,064,125 bytes |
| Firma | Bloque v2 presente; no v1 ni v3 |
| SHA-256 del archivo | `c04225e29718945cf2782c70e49ee6e71eb717c1a0f5a872fbb3a37f1f173e9a` |

El atributo `debuggable` no está declarado en el manifiesto inspeccionado. Se identificaron `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`, `USE_BIOMETRIC`, `USE_FINGERPRINT` y el permiso interno `com.econolab.mobile.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`. Los dos de biometría llegan desde dependencias; eso no demuestra que la app tenga un acceso biométrico implementado. Revisar su necesidad y documentar su origen.

`allowBackup` aparece activado y existen referencias a reglas de respaldo. Esto por sí solo no demuestra que el token sea respaldado: SecureStore incluye exclusiones que deben comprobarse en esas reglas al preparar el informe de seguridad. No se declara un fallo de almacenamiento solo por leer ese atributo.

La inspección se hizo con Androguard 4.1.4. No se utilizó para adjudicar como realizado un reporte de JADX/MobSF ni una verificación criptográfica completa de la firma. El APK y los registros crudos se conservaron en carpetas locales ignoradas; no deben subirse a Git junto con URLs temporales de logs, credenciales o datos clínicos.

## Qué falta desarrollar y dónde corresponde

Esta tabla relaciona los hallazgos con las HUs y tareas **ya existentes**. No crea otro backlog ni cambia fechas o criterios de aceptación; el equipo debe acordar cómo incorporar requisitos nuevos de la rúbrica.

| Trabajo técnico pendiente | Relación con la planeación oficial | Evidencia de terminación |
| --- | --- | --- |
| Completar y explicar MVVM/Clean y los cuatro patrones sin cambiar contratos innecesariamente | HU01: #11; HU02: #16–#18 | Diagrama coherente con el código; Repository y separación de presentación/datos probados; explicación de cada patrón y pruebas que usen los contratos. |
| Incorporar SAST y análisis de dependencias; definir DAST contra un entorno de pruebas autorizado | HU01: #14, #36–#38; HU08: #34–#35 | Workflow y reportes con commit, herramienta, reglas y tratamiento de hallazgos; ejecución dinámica real donde corresponda. |
| Renovación de sesión y pruebas de 401, concurrencia, revocación y cierre definitivo | HU03: #19–#21; HU07: #31 | Contrato real de refresh en el backend existente y cliente que lo utiliza. No simular renovación guardando la contraseña. |
| Pinning SHA-256 con respaldo y procedimiento de rotación | HU01: #12; HU07: #31; HU08: #34 | Build nativo con pins; conexión válida aceptada y pin incorrecto rechazado; pruebas documentadas de rotación. |
| Aviso de privacidad, consentimiento, acceso, rectificación, cancelación propia y oposición | HU06: #28–#29; HU07: #30–#32; HU08: #34 | Pantallas y endpoints reales con autorización, persistencia de decisiones y pruebas; política y contacto públicos válidos. |
| Activar R8/reducción de recursos mediante configuración persistente de Expo/CNG | HU01: #36; HU08: #34–#35 | Nuevo Release, configuración generada, tarea R8 en logs, reglas pertinentes, mapping protegido y reporte JADX/MobSF. |
| Ejecutar matriz funcional en Debug y Release, corregir y repetir | HU08: #33–#35 | Matriz con resultados, dispositivo, versión, incidencias, capturas y verificación después de corregir. |
| Preparar AAB y completar envío real a Google Play | HU08 y tareas existentes de Build/Validaciones/Pruebas | Build firmado y ficha con estado real en Console. El envío y los acuerdos dependen del titular. |

Consideraciones para implementar correctamente:

1. Una instancia compartida de `ApiClient` es una base de Singleton a nivel de módulo; no se afirma que su constructor sea privado. `createSession` es una fábrica sencilla. React Context aporta suscripciones, pero eso no demuestra por sí solo los cuatro patrones ni una arquitectura Clean completa. Debe poder explicarse qué problema resuelve cada uno.
2. El cliente actual invalida sesión ante 401. Google OAuth y sus tokens de otro servicio no constituyen un endpoint de refresh para el JWT de esta app.
3. El pinning requiere código nativo y una compilación propia; Expo Go no acredita esa configuración. No fijar únicamente un certificado temporal de Render sin respaldo o plan de rotación. [Referencia OWASP](https://mas.owasp.org/MASTG/knowledge/android/MASVS-NETWORK/MASTG-KNOW-0015/).
4. El perfil propio está en `backend/src/users/user-profile.controller.ts`. `DELETE /api/admin/users/:id` es una operación administrativa diferente; no se usó ni se probó borrando usuarios reales. Antes de implementar cancelación hay que definir qué datos de cuenta se borran, qué registros del laboratorio requieren conservación y cómo se atiende una solicitud válida.
5. La rúbrica nombra `GET/PUT /profile` y `DELETE /account`; el proyecto tiene `GET/PATCH /users/me` para acceso y rectificación. Confirmar si el docente acepta equivalencia funcional. No anunciar rutas inexistentes ni romper la web para cambiarles el nombre.
6. R8 optimiza/ofusca código Android y recursos. No vuelve imposible descompilar la app ni protege automáticamente toda la lógica JavaScript. El reporte debe describir resultados y límites, sin prometer que el APK es irrecuperable. [Documentación Android](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization).
7. SAST analiza código; DAST necesita una aplicación o servicio en ejecución. No presentar un escaneo estático ni las ocho peticiones de integración como si fueran un análisis dinámico de seguridad. Definir con el docente qué combinación de herramientas y evidencias satisface su instrumento.

## Planeación oficial comprobada

[GitHub Project 4: Econolab Movil](https://github.com/users/Josafock/projects/4): 37 elementos consultados, 14 campos y seis Sprints. Se mantuvieron intactos.

| HU | Sprint y fechas oficiales | Estado observado |
| --- | --- | --- |
| HU01 #1 | Sprint 1: 27 septiembre–3 octubre | Done |
| HU02 #2 | Sprint 1: 27 septiembre–3 octubre | In Progress |
| HU03 #3 | Sprint 2: 4–10 octubre | Todo |
| HU04 #4 | Sprint 3: 11–17 octubre | Todo |
| HU05 #6 | Sprint 4: 18–24 octubre | Todo |
| HU06 #7 | Sprint 4: 18–24 octubre | Product Backlog |
| HU07 #8 | Sprint 5: 25–31 octubre | Product Backlog |
| HU08 #9 | Sprint 6: 1–7 noviembre | Product Backlog |

Las 29 tareas #10–#38 aparecen en `Todo`, sin Sprint individual. El tablero no refleja todavía todo el código disponible. Esto requiere revisión y aceptación del equipo; no se marcaron elementos como terminados automáticamente. Que las fechas de las iteraciones 1–3 ya hayan pasado no acredita el cierre académico de esos Sprints.

La rúbrica pide `develop`, pero las instrucciones previas del proyecto organizan PR por HU hacia `main` y reservan al responsable su integración. Confirmar con el docente si acepta el flujo existente o si debe incorporarse `develop` mediante un acuerdo del equipo. Crear una rama vacía hoy no demostraría uso continuo previo.

## Acciones que dependen de ti o de tu equipo

1. **Definir privacidad y soporte reales.** Indicar el correo que sí atenderán, URL pública de la política, responsable de los datos, finalidades, conservación y atención de cancelación/oposición. Publicar a tu nombre no te convierte automáticamente en responsable de todos los datos de pacientes del laboratorio. Estos datos no pueden inventarse desde el código. La configuración local revisada no tiene URL de privacidad ni correo de soporte válidos.
2. **Cuenta de Play Console y verificaciones.** Como elegiste publicar a tu nombre, tú debes crear/verificar la cuenta, aceptar los acuerdos y cubrir el registro. Google exige al titular al menos 18 años y una tarifa única de US$25; si no tienes esa edad, debe intervenir un adulto o entidad elegible. Entrega identidad y medios de pago directamente a Google, no en el chat. [Requisitos oficiales](https://support.google.com/googleplay/android-developer/answer/6112435).
3. **Prueba cerrada y participantes reales.** Para cuentas personales nuevas sujetas al requisito, Google pide al menos 12 participantes inscritos continuamente durante 14 días antes de solicitar acceso a producción. Organiza participantes reales y conserva sus comentarios. Cumplir el plazo permite solicitar acceso, no garantiza aprobación inmediata. [Requisitos oficiales de pruebas](https://support.google.com/googleplay/android-developer/answer/14151465).
4. **Pruebas y capturas en teléfono.** Ejecutar el formato [MATRIZ_CAJA_NEGRA.csv](evidencias-rubrica/MATRIZ_CAJA_NEGRA.csv) sobre ambos builds, anotar el dispositivo y la versión, y adjuntar imágenes propias. Se pueden automatizar partes cuando haya emulador o dispositivo disponible, pero no se ha observado tu teléfono desde esta revisión. No marcar como aprobados casos que aún no existen.
5. **Revisión del equipo y del docente.** Acordar `develop`, equivalencia de `/tests` y rutas de perfil, aceptación de evidencias SAST/DAST, responsables de las tareas y aportaciones reales. El propietario revisa PR, reglas de `main`, secrets, estados y cierres de Sprint. No fabricar commits, fechas o capturas para aparentar colaboración.
6. **Envío real y prueba de publicación.** Completar Seguridad de los datos, acceso para el revisor con una cuenta dedicada de prueba, clasificación y ficha, usando las funciones reales del build final. Guardar la captura de Console en estado enviado a revisión o publicado y el enlace si ya existe. No usar una pantalla de borrador como evidencia de revisión activa.

La política específica de Google sobre eliminación de cuentas se activa cuando la app permite crear cuentas, también mediante los flujos vinculados que describe Google. Hay que evaluar el recorrido completo. **La rúbrica exige cancelación ARCO en cualquier caso**, aunque un supuesto particular de Play no aplique. [Política oficial de eliminación](https://support.google.com/googleplay/android-developer/answer/13327111). Esta revisión técnica no certifica cumplimiento legal.

## Orden recomendado según las fechas de la rúbrica

- **Actividad 5, 22/10/2026:** la fecha indicada ya pasó. Documentar honestamente lo disponible y acordar cómo subsanar versionamiento, CI de seguridad y aportaciones; no retrofechar trabajo.
- **Actividad 4, 29/10/2026:** priorizar arquitectura/patrones, evidencia de interfaces y pruebas. Preparar la demostración y confirmar las equivalencias señaladas.
- **Actividades 6 y 7, 26/11/2026:** completar seguridad/ARCO, nuevo Release con R8, análisis y matriz nativa. Iniciar los trámites y la organización de las pruebas de Play con anticipación por su duración.

Estas son fechas de entrega del instrumento; **no sustituyen ni redistribuyen los Sprints oficiales**.

## Archivos para preparar la entrega

- [Guía de evidencias y capturas](evidencias-rubrica/GUIA_EVIDENCIAS.md).
- [Matriz de pruebas nativas Debug/Release](evidencias-rubrica/MATRIZ_CAJA_NEGRA.csv): plantilla para llenar, no resultados ejecutados.
- [Inspección del APK](evidencias-rubrica/APK_INSPECCION_2026-10-23.json): metadatos y permisos, sin secretos.

Se conservaron los documentos anteriores como historial y se añadieron avisos donde podían confundirse con el resultado actual. Los pendientes técnicos de esta revisión son trabajo de implementación verificable; no se presentan como funciones terminadas ni como tareas que el alumno deba resolver solo.
