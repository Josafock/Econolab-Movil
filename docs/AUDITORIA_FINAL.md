# Auditoría final de ECONOLAB Mobile

Fecha de revisión: 6 de octubre de 2026, horario de Ciudad de México. Repositorio: [Josafock/Econolab-Movil](https://github.com/Josafock/Econolab-Movil).

**Actualización:** la app usa `https://backend-econolab-escuela-1.onrender.com/api` y Expo inicia por túnel. Se adaptaron el logo de la web, las pantallas y la navegación inferior en [PR47](https://github.com/Josafock/Econolab-Movil/pull/47) y [PR48](https://github.com/Josafock/Econolab-Movil/pull/48). El perfil completo está implementado en [PR49](https://github.com/Josafock/Econolab-Movil/pull/49), y el icono nativo en [PR50](https://github.com/Josafock/Econolab-Movil/pull/50). El Project oficial ya pudo verificarse: 14 campos y seis Sprints. El propietario autorizó integrar el backend el 6 de octubre; [PR1](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/1) quedó integrado en `933215a` y su CI de `main` se habilitó en `35d9fb7`. El perfil está publicado y comprobado en Render: siete comprobaciones de integración y edición HTTP/móvil aprobadas, con la cuenta de pruebas restaurada. Los PR y `main` del móvil permanecen sin merges. Ver [perfil](PROFILE_COMPATIBILITY.md), [iconos](ICONOS.md) y [Project](PROJECT_VERIFICATION.md).

## Estado general

La aplicación está implementada en React Native, Expo SDK 57 y TypeScript. Utiliza el backend NestJS existente. La versión acumulada se entrega en `feature/HU-08-pruebas`; `main` conserva el commit original. Hay ocho ramas feature y ocho PR hacia `main`.

**No se declara cumplimiento al 100 %.** Falta la ejecución física Android/iOS. También permanecen alertas de dependencias y la configuración de secrets para el workflow remoto de integración. La publicación del perfil y los campos/Sprints del Project están comprobados. No se cierran issues ni se cambia la planificación para presentar avances sin validación del equipo.

| Comprobación | Resultado obtenido |
| --- | --- |
| Instalación desde lockfile | `npm ci` aprobado |
| Lint | Aprobado, sin warnings permitidos |
| TypeScript | Aprobado, modo estricto |
| Unit tests | **104 pruebas aprobadas en 7 suites** |
| Build Metro | Android e iOS exportados correctamente; no son APK/IPA |
| Integración real | Siete comprobaciones aprobadas contra Render publicado; también pasaron con los módulos reales locales y la base existente |
| Edición de perfil real | Consulta, nombre/correo, contraseña obligatoria, campos protegidos, persistencia, login nuevo y restauración aprobados en Render |
| Cambio de contraseña real | Aprobado en la cuenta de pruebas; contraseña original restaurada |
| Navegación y formularios | Preview Chromium a 320/390/768 px aprobado, incluido guardar/restaurar perfil y saludo actualizado, con todas las peticiones de datos a Render |
| GitHub Actions | CI de las ocho HUs y de las correcciones aprobado; PR49/50 verifican 104 tests, prebuild iOS y bundles Android/iOS |
| Icono nativo | SVG original, cinco PNG y recursos Android/prebuild verificados; requiere una app compilada para verlo en el launcher |
| Project oficial | 37 issues, 14 campos y seis Sprints comprobados sin modificaciones |
| Seguridad de dependencias | Pendiente: 57 alertas, 49 altas y 8 moderadas; 0 críticas |

La integración actual exige acceso anónimo rechazado, login, lectura del perfil, catálogo/paginación, búsqueda/filtros, detalle/parámetros y token revocado después de logout. El recorrido web final también comprobó guardar nombre/correo, confirmación de contraseña, saludo actualizado y restauración de la cuenta de pruebas. Todas las peticiones de datos fueron a Render; la herramienta externa de QA retiró Origin por el CORS de localhost, sin redirigir a un backend local ni simular respuestas. Estas pruebas acreditan el contrato publicado, pero no una ejecución física Android/iOS.

## HUs — ramas originales del 5 de octubre

Esta sección conserva el alcance de los ocho PR originales #39–#46. Las correcciones del 6 de octubre están en PR47–#50 y la rama acumulada HU08; en particular, PR49 sustituye el límite funcional del PR44 histórico. Las referencias `T-XX.YY` en commits identifican las tareas de cada HU; no sustituyen los nombres oficiales `TH` del tablero.

### HU-01 — Arquitectura

- Issue: [#1](https://github.com/Josafock/Econolab-Movil/issues/1).
- Sub-issues: #10, #11, #12, #13, #14; subtareas CI de #14: #36, #37, #38.
- Branch: `feature/HU-01-arquitectura`.
- Commits propios: `bd6616b`.
- Pull Request: [#39](https://github.com/Josafock/Econolab-Movil/pull/39).
- Tests: configuración; lint, TypeScript, unit tests y build en [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401583401).
- Estado: infraestructura implementada, con rutas, transporte HTTP, configuración y workflows.
- Pendientes: confirmar arranque en dispositivo; integración remota al cerrar Sprint.

### HU-02 — Interfaz móvil

- Issue: [#2](https://github.com/Josafock/Econolab-Movil/issues/2).
- Sub-issues: #15, #16, #17, #18.
- Branch: `feature/HU-02-interfaz`.
- Commits propios: `4d91d76`.
- Pull Request: [#40](https://github.com/Josafock/Econolab-Movil/pull/40).
- Tests: [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401587244); recorrido visual del conjunto en preview web.
- Estado: componentes compartidos, logotipo, colores, wireframes, tamaños táctiles y estados implementados.
- Pendientes: lector de pantalla, fuente grande y teclado en Android/iOS.

### HU-03 — Autenticación

- Issue: [#3](https://github.com/Josafock/Econolab-Movil/issues/3).
- Sub-issues: #19, #20, #21.
- Branch: `feature/HU-03-autenticacion`.
- Commits propios: `e01d5ce`.
- Pull Request: [#41](https://github.com/Josafock/Econolab-Movil/pull/41).
- Tests: sesión, validaciones, almacenamiento, restauración, errores y concurrencia; login/revocación reales del conjunto; [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401142717).
- Estado: login, rutas protegidas, SecureStore nativo, expiración y logout implementados.
- Pendientes: comprobar SecureStore y restauración en un dispositivo real. En web la sesión solo vive en memoria y termina al recargar.

### HU-04 — Módulos principales

- Issue: [#4](https://github.com/Josafock/Econolab-Movil/issues/4).
- Sub-issues: #22, #23, #24.
- Branch: `feature/HU-04-modulos`.
- Commits propios: `2cfc75b`.
- Pull Request: [#42](https://github.com/Josafock/Econolab-Movil/pull/42).
- Tests: dashboard, acceso a estudios/perfil y navegación en preview del conjunto; [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401146719).
- Estado: dashboard como menú, navegación y control de acceso implementados. No se crean módulos sin respaldo funcional.
- Pendientes: botón físico de regreso y ciclo de segundo plano en Android/iOS.

### HU-05 — Estudios

- Issue: [#6](https://github.com/Josafock/Econolab-Movil/issues/6). La issue #5 es PB-05, no HU05.
- Sub-issues: #25, #26, #27.
- Branch: `feature/HU-05-estudios`.
- Commits propios: `397327d`.
- Pull Request: [#43](https://github.com/Josafock/Econolab-Movil/pull/43).
- Tests: esquemas, decimales, filtros y parámetros; catálogo, búsqueda, paginación y detalle reales; [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401149668).
- Estado: consulta con datos reales, búsqueda, filtros, paginación, refresco y detalle implementados.
- Pendientes: comprobar gesto de refresco y desplazamiento en dispositivo.

### HU-06 — Perfil

- Issue: [#7](https://github.com/Josafock/Econolab-Movil/issues/7).
- Sub-issues: #28, #29; no se declara completa la edición de perfil.
- Branch: `feature/HU-06-perfil`.
- Commits propios: `c0f62cb`.
- Pull Request: [#44, borrador](https://github.com/Josafock/Econolab-Movil/pull/44).
- Tests: campos protegidos, validación de contraseña, tratamiento del 401, cambio real y restauración en cuenta de pruebas; [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401153266).
- Estado: **parcial**. Consulta la identidad real recibida en login y permite cambiar contraseña mediante el endpoint existente.
- Pendientes en esa versión del 5 de octubre: el backend no tenía lectura actualizada ni edición de nombre/correo del usuario actual. Ese límite quedó resuelto posteriormente en PR49 y PR1 del backend, integrado y publicado en Render con autorización expresa. [Perfil actual y pruebas](PROFILE_COMPATIBILITY.md). El PR44 conserva su alcance parcial histórico.

### HU-07 — Errores

- Issue: [#8](https://github.com/Josafock/Econolab-Movil/issues/8).
- Sub-issues: #30, #31, #32.
- Branch: `feature/HU-07-errores`.
- Commits propios: `7aa79d0`.
- Pull Request: [#45](https://github.com/Josafock/Econolab-Movil/pull/45).
- Tests: HTTP 400/401/403/404/429/500, timeout, red, cancelación, formato inesperado y solicitudes concurrentes; [CI aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401155768).
- Estado: errores centralizados, reintentos, aviso de conexión y mensajes sin información interna implementados.
- Pendientes: reproducir pérdida de red y sesión revocada en ejecución nativa.

### HU-08 — Pruebas

- Issue: [#9](https://github.com/Josafock/Econolab-Movil/issues/9).
- Sub-issues: #33, #34, #35.
- Branch: `feature/HU-08-pruebas`; correcciones en `fix/HU-08-auditoria` incorporadas por avance de la referencia, sin merge.
- Commits propios: `f7d68c3`, `1292abb`, `b8b099a`; además, el commit de documentación que contiene este reporte.
- Pull Request: [#46](https://github.com/Josafock/Econolab-Movil/pull/46).
- Tests: 87 unit tests, 6 comprobaciones de integración real, contraseña y recorrido web; [CI inicial aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/37401159443). [CI de la corrección de dependencias y prebuild](https://github.com/Josafock/Econolab-Movil/actions/runs/37402154712).
- Estado: pruebas y automatización implementadas; no se declara cerrado el Sprint ni la validación nativa.
- Pendientes: dispositivo, integración remota por Sprint y alertas de dependencias.

## Git

- `main` local y remoto: `048b6d3`, commit inicial, sin cambios de funcionalidades.
- Ocho ramas feature publicadas con el patrón solicitado; ocho PR abiertos hacia `main` (#39–#46).
- Rama fix para las correcciones de HU08; los commits se incluyen en el PR de esa HU.
- Ramas dependientes basadas en la anterior. Los PR son acumulativos mientras no se integren sus bases y lo explican en sus cuerpos.
- **Merges en el repositorio móvil: 0.** Sin push de funcionalidades a su `main`. El PR1 del backend se integró después de la autorización explícita del propietario.
- No se recrearon, eliminaron, renombraron ni cerraron issues; tampoco se crearon tags de Sprint.
- El código de «Hola mundo» previo se conservó en un stash local, identificado como respaldo antes de ECONOLAB Mobile.

El titular habilitó `read:project` y se verificó el Project oficial número 4 mediante CLI y GraphQL. Se encontraron seis Sprints de siete días; las HUs tienen Sprint asignado y las 29 subtareas figuran en Todo sin Sprint individual. HU01 está en Done aunque sus subtareas siguen en Todo. La [verificación completa](PROJECT_VERIFICATION.md) registra esos datos sin modificar estados, fechas ni responsables.

## CI/CD

`.github/workflows/ci.yml`: push en ramas y PR hacia `main`; Node 24, `npm ci`, lint, TypeScript, Jest y exportación Android/iOS. HU08 añade generación del proyecto iOS sin instalar CocoaPods. Los fallos no se omiten ni se convierten en éxitos.

GitHub ejecutó correctamente el CI de las ocho HUs. HU01 y HU02 inicialmente no tenían ejecución; reabrir sus PR disparó validaciones correctas sin commits vacíos. Una ejecución anterior de HU08 fue cancelada por concurrencia al llegar una nueva revisión; las posteriores finalizaron correctamente. No se atribuye la ausencia inicial de runs a una causa no demostrada.

`.github/workflows/integration.yml`: tags `sprint-01` a `sprint-06` y `workflow_dispatch`. Requiere `INTEGRATION_API_URL`, `INTEGRATION_EMAIL` e `INTEGRATION_PASSWORD` como secrets. Si faltan, falla de manera explícita. La API necesita HTTPS y acceso desde el runner; el backend local no cumple ese acceso remoto. El responsable decide el cierre de cada Sprint. El dispatch aparecerá al integrar el workflow en la rama predeterminada.

Resultados móviles: instalación, lint, TypeScript, 104 unit tests y exportación Android/iOS aprobados. Prebuild Android completado; iOS aprobado en el runner Ubuntu de [PR50](https://github.com/Josafock/Econolab-Movil/actions/runs/37562907591). [PR49](https://github.com/Josafock/Econolab-Movil/actions/runs/37562903885) también pasó CI. El backend del perfil tiene CI y SonarCloud aprobados; sus 22 pruebas nuevas y 52 pruebas completas pasaron. El [CI de main del backend](https://github.com/DavidHdz117/Backend_Econolab_Escuela/actions/runs/37564684292) aprobó la revisión integrada. Las siete comprobaciones de integración pasaron tanto en Render como contra AuthModule, UsersModule y StudiesModule reales locales, con la base existente y cambios de esquema desactivados. No se generaron APK/IPA ni se publicó una versión independiente de la app móvil.

## Seguridad

- La app no persiste contraseñas. Los campos se vacían tras enviar credenciales o cambiar contraseña.
- Token y sesión en SecureStore para Android/iOS; memoria para web. No se usan localStorage ni datos ficticios de autenticación.
- Restauración validada contra el servidor; protección de pantallas; expiración y borrado local. El backend conserva la autoridad sobre firma, rol y revocación.
- Logout solicita revocación y elimina la sesión local. Si no se confirma la revocación por falta de red, se informa claramente.
- Validación de entradas y respuestas; 401/403 controlados; protección frente a respuestas tardías de una sesión anterior.
- HTTPS obligatorio fuera del modo de desarrollo. `EXPO_PUBLIC_API_URL` es configuración pública, nunca una contraseña o clave.
- `.env` y `.env.integration` ignorados. Solo ejemplos sin secretos rastreados. El escaneo de las ramas no encontró las credenciales locales ni patrones de claves privadas/tokens conocidos.
- Cuenta independiente creada por autorización del usuario, con credenciales únicamente en el archivo local ignorado. No están en código, PR o documentación.
- Dependencias revisadas y parche acotado de uuid aplicado. **57 alertas siguen abiertas** (49 altas y 8 moderadas), con límites y fuentes en [revisión de dependencias](DEPENDENCIES.md). Sharp se añadió solo como herramienta de exportación de los iconos, sin aumentar ese conteo.

## Backend

Se reutilizan las siguientes rutas del backend existente, bajo su prefijo real `/api`:

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/auth/login` | Login y datos disponibles del usuario |
| POST | `/auth/logout` | Revocación de la sesión |
| GET | `/studies` | Catálogo, filtros, paginación y comprobación de sesión |
| GET | `/studies/:id` | Detalle y precios |
| GET | `/studies/:id/details` | Parámetros/categorías |
| PATCH | `/users/update-password` | Cambio de contraseña |
| GET | `/users/me` | Lectura actualizada del perfil autenticado; publicado y verificado en Render |
| PATCH | `/users/me` | Edición de nombre/correo; publicado y verificado en Render |

Los endpoints de perfil están implementados, integrados y probados en Render publicado. No existe refresh token. El identificador SQL numérico se normaliza a texto; los precios decimales se validan sin transformar valores ausentes en cero.

La solicitud posterior del usuario autorizó completar los endpoints pendientes. Los cambios se desarrollaron en `fix/HU-06-perfil-autenticado`, [PR1 del backend](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/1), commits `c612c76` y `63b84f2`: controller, servicio, DTO, registro en UsersModule, pruebas y CI. El propietario autorizó después la integración exclusiva del backend: merge `933215a`, seguido de `35d9fb7` para validar también `main`. Reutilizan JWT/roles y el repositorio Users. **Cambios de esquema y migraciones: 0.** No se creó otra API o base de datos. Las pruebas usan la cuenta independiente, restauran nombre/correo/contraseña originales y cierran sus sesiones; no modifican usuarios operativos ni estudios.

## Pendientes

1. Ejecutar la app en Android/iOS y registrar navegación, SecureStore, teclado, accesibilidad, regreso, refresco, pérdida de red y revocación. Este equipo no tiene SDK/emulador Android configurado; Windows no ejecuta el simulador iOS.
2. El equipo debe revisar las subtareas sin Sprint y la diferencia de estados de HU01 si necesita corregir el tablero. La verificación está terminada; no se modificó la planificación.
3. Configurar los secrets del workflow para un backend HTTPS de pruebas accesible desde GitHub; Render y el perfil publicado ya están comprobados. El responsable decide cuándo ejecutar la integración al cerrar el Sprint; no se emiten tags automáticamente.
4. Dar seguimiento a las 57 alertas de dependencias y resolverlas con versiones compatibles; el override incompatible del decoder y `npm audit fix --force` no son soluciones verificadas.

La integración de los PR del móvil sigue reservada al responsable, por diseño del flujo solicitado. La excepción posterior autorizó integrar únicamente el backend.
