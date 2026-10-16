# Auditoría final de ECONOLAB Mobile

Fecha: 5 de octubre de 2026, horario de Ciudad de México. Repositorio: [Josafock/Econolab-Movil](https://github.com/Josafock/Econolab-Movil).

**Actualización del 6 de octubre:** la app ya usa `https://backend-econolab-escuela-1.onrender.com/api`; las seis comprobaciones de integración pasan contra Render. Expo inicia por túnel y se verificaron el bundle Android público y los WebSockets de desarrollo. Hay 88 pruebas unitarias aprobadas y 57 alertas de dependencias (49 altas, 8 moderadas, 0 críticas). Se adaptaron el logo completo de la web, las pantallas y la navegación inferior; revisión Chromium real a 320/390/768 px aprobada. Correcciones en [PR47](https://github.com/Josafock/Econolab-Movil/pull/47) y [PR48](https://github.com/Josafock/Econolab-Movil/pull/48), incluidas en la rama acumulada HU08 sin merges. Ver [conexión actual](CONEXION_RENDER.md) y [diseño actual](DISENO_MOVIL.md). El cuerpo siguiente conserva los resultados históricos del 5 de octubre; el entorno HTTPS ya está disponible, aunque faltan los secrets del workflow de integración remota. Los límites de HU06, Project y ejecución física siguen vigentes.

## Estado general

La aplicación está implementada en React Native, Expo SDK 57 y TypeScript. Utiliza el backend NestJS existente. La versión acumulada se entrega en `feature/HU-08-pruebas`; `main` conserva el commit original. Hay ocho ramas feature y ocho PR hacia `main`.

**No se declara cumplimiento al 100 %.** HU06 tiene una incompatibilidad real de contrato; falta ejecución Android/iOS, verificación de campos del Project y un entorno HTTPS para la integración remota de cierre de Sprint. También permanecen alertas de dependencias. No se ocultan estos puntos ni se cierran las issues como si todo estuviera terminado.

| Comprobación | Resultado obtenido |
| --- | --- |
| Instalación desde lockfile | `npm ci` aprobado |
| Lint | Aprobado, sin warnings permitidos |
| TypeScript | Aprobado, modo estricto |
| Unit tests | **87 pruebas aprobadas en 7 suites** |
| Build Metro | Android e iOS exportados correctamente; no son APK/IPA |
| Integración real | **6 comprobaciones aprobadas** usando módulos de la app y backend existente |
| Cambio de contraseña real | Aprobado en la cuenta de pruebas; contraseña original restaurada |
| Navegación y formularios | Preview Chromium de 390 × 844 aprobado, con backend real |
| GitHub Actions | CI de las ocho HUs aprobado; la corrección de HU08 añade prebuild iOS |
| Seguridad de dependencias | Pendiente: 58 alertas, 50 altas y 8 moderadas; 0 críticas |

La integración prueba acceso anónimo rechazado, login, catálogo/paginación, búsqueda/filtros, detalle/parámetros y token revocado después de logout. El recorrido web prueba login, dashboard, listado, detalle, búsqueda vacía, perfil, validaciones, logout y un enlace protegido sin sesión. Ninguna de estas pruebas acredita una ejecución física Android/iOS.

## HUs

Las issues y relaciones sub-issue se obtuvieron del repositorio existente. Las referencias `T-XX.YY` en commits identifican las tareas de cada HU; no sustituyen los nombres oficiales `TH` del tablero.

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
- Pendientes: el backend no tiene lectura actualizada ni edición de nombre/correo del usuario actual. [Compatibilidad y propuesta](PROFILE_COMPATIBILITY.md). No hay guardado simulado ni endpoint inventado.

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
- **Merges realizados por Codex: 0.** Sin push de funcionalidades a `main`.
- No se recrearon, eliminaron, renombraron ni cerraron issues; tampoco se crearon tags de Sprint.
- El código de «Hola mundo» previo se conservó en un stash local, identificado como respaldo antes de ECONOLAB Mobile.

Se consultaron issues y relaciones por REST. La credencial de GitHub carece de `read:project`: no se pudieron verificar Sprint, fechas y campos del Project. No se inventaron ni modificaron. El titular puede habilitar la lectura con `gh auth refresh -s read:project`.

## CI/CD

`.github/workflows/ci.yml`: push en ramas y PR hacia `main`; Node 24, `npm ci`, lint, TypeScript, Jest y exportación Android/iOS. HU08 añade generación del proyecto iOS sin instalar CocoaPods. Los fallos no se omiten ni se convierten en éxitos.

GitHub ejecutó correctamente el CI de las ocho HUs. HU01 y HU02 inicialmente no tenían ejecución; reabrir sus PR disparó validaciones correctas sin commits vacíos. Una ejecución anterior de HU08 fue cancelada por concurrencia al llegar una nueva revisión; las posteriores finalizaron correctamente. No se atribuye la ausencia inicial de runs a una causa no demostrada.

`.github/workflows/integration.yml`: tags `sprint-01` a `sprint-06` y `workflow_dispatch`. Requiere `INTEGRATION_API_URL`, `INTEGRATION_EMAIL` e `INTEGRATION_PASSWORD` como secrets. Si faltan, falla de manera explícita. La API necesita HTTPS y acceso desde el runner; el backend local no cumple ese acceso remoto. El responsable decide el cierre de cada Sprint. El dispatch aparecerá al integrar el workflow en la rama predeterminada.

Resultados locales finales: instalación, lint, TypeScript, 87 unit tests, exportación Android/iOS e integración real aprobados. Prebuild iOS no está disponible en Windows; se comprueba en el runner Ubuntu. No se generaron APK/IPA ni se publicaron versiones de producción.

## Seguridad

- La app no persiste contraseñas. Los campos se vacían tras enviar credenciales o cambiar contraseña.
- Token y sesión en SecureStore para Android/iOS; memoria para web. No se usan localStorage ni datos ficticios de autenticación.
- Restauración validada contra el servidor; protección de pantallas; expiración y borrado local. El backend conserva la autoridad sobre firma, rol y revocación.
- Logout solicita revocación y elimina la sesión local. Si no se confirma la revocación por falta de red, se informa claramente.
- Validación de entradas y respuestas; 401/403 controlados; protección frente a respuestas tardías de una sesión anterior.
- HTTPS obligatorio fuera del modo de desarrollo. `EXPO_PUBLIC_API_URL` es configuración pública, nunca una contraseña o clave.
- `.env` y `.env.integration` ignorados. Solo ejemplos sin secretos rastreados. El escaneo de las ramas no encontró las credenciales locales ni patrones de claves privadas/tokens conocidos.
- Cuenta independiente creada por autorización del usuario, con credenciales únicamente en el archivo local ignorado. No están en código, PR o documentación.
- Dependencias revisadas y parche acotado de uuid aplicado. **58 alertas siguen abiertas**, con límites y fuentes en [revisión de dependencias](DEPENDENCIES.md).

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

Incompatibilidades: no existe lectura/edición completa del perfil ni refresh token. El cliente usa los contratos reales y evita inventar operaciones. El identificador SQL numérico se normaliza a texto; los precios decimales se validan sin transformar valores ausentes en cero.

**Modificaciones al código, contratos y esquema del backend: 0.** No se creó otra API o base de datos. Para las pruebas se arrancó el backend existente con sincronización de esquema desactivada, sin editar sus archivos de configuración. Excepción autorizada de datos: creación y confirmación de una cuenta de pruebas mediante el servicio existente; su contraseña se cambió temporalmente en la prueba y quedó restaurada. No se alteraron usuarios operativos ni estudios.

## Pendientes

1. Definir e implementar en el backend, con autorización explícita, un contrato de consulta actualizada y edición de los campos personales permitidos para completar HU06.
2. Ejecutar la app en Android/iOS y registrar navegación, SecureStore, teclado, accesibilidad, regreso, refresco, pérdida de red y revocación. Este equipo no tiene SDK/emulador Android configurado; Windows no ejecuta el simulador iOS.
3. Habilitar lectura del Project para verificar trazabilidad de Sprint/fechas/estado, sin alterar la planificación existente.
4. Proporcionar un backend de pruebas HTTPS accesible desde GitHub y sus secrets; el responsable podrá ejecutar la integración al cerrar el Sprint. No se dispone de ese entorno remoto y no se emiten tags automáticamente.
5. Dar seguimiento a las 58 alertas de dependencias y resolverlas con versiones compatibles; el override incompatible del decoder y `npm audit fix --force` no son soluciones verificadas.

La integración manual de PR por el responsable se mantiene pendiente por diseño del flujo solicitado; Codex no debe realizarla.
