# Resultado técnico de la versión 1.1

Este registro conserva el alcance histórico del 24 de octubre. Para las
correcciones y ejecuciones del 26 de octubre, consultar
[CI_CORRECCIONES_A4.md](CI_CORRECCIONES_A4.md) y
[el seguimiento A4](evidencias-a4/SEGUIMIENTO.md). Los conteos y estados de esta
revisión no se trasladan a una ejecución posterior.

Verificación: **24 de octubre de 2026**. Esta entrega implementa los pendientes técnicos del diagnóstico anterior; no asigna una calificación ni acredita automáticamente todos los requisitos de publicación y trabajo en equipo.

## Entrega y planeación

- Móvil: rama `fix/HU-08-seguridad-rubrica`, [PR58](https://github.com/Josafock/Econolab-Movil/pull/58). El propietario conserva la decisión de integrarlo según sus HUs y Sprints. No se fusionó `main` del móvil ni se modificó el Project.
- Backend existente: [PR3](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/3), [PR4](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/4) y [PR5](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/5) y [PR6](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/6), integrados con autorización. Aviso y contratos comprobados en Render.
- APK distribuible: versión **1.1.0**, código **4**, paquete **com.econolab.mobile**, fuente `d2d92c55057f42ea65503e29e288c2ad2d73f0a5`. Los cambios posteriores de QA/documentación no modifican el código de interfaz incluido en este APK.

## Implementación

| Pendiente anterior | Resultado de la versión 1.1 |
| --- | --- |
| Arquitectura y patrones | MVVM/Clean explícitos en estudios y privacidad. Singleton de transporte, Factory, Repository y Observer documentados y probados. |
| JWT y renovación | Access de 15 minutos, refresh opaco de sesión de 30 días, rotación, detección de reutilización, renovación agrupada de 401 y protección ante carreras de logout/nuevo login. La web conserva su contrato. |
| Pinning y almacenamiento | SPKI SHA-256 por hostname, inicialización obligatoria antes de API y fallo cerrado; credenciales en SecureStore, sin contraseña ni respaldo Android. Los pins de CA permiten renovación dentro de esa cadena y tienen un alcance mayor que fijar solo una clave de servidor. |
| Privacidad | Consentimiento inicialmente desmarcado, aviso/versionado, consulta/rectificación, preferencias opcionales persistidas y cancelación propia protegida. No elimina expedientes clínicos. |
| Responsable y contacto | Jesús David Saldaña Hernández, 20230009@uthh.edu.mx. [Aviso público](https://backend-econolab-escuela-1.onrender.com/api/privacy) y [cancelación externa](https://backend-econolab-escuela-1.onrender.com/api/privacy/account-deletion) disponibles. |
| SAST/DAST | Semgrep y dependencias; backend real con PostgreSQL aislado, pruebas HTTP y ZAP baseline. Sus resultados bloquean la entrega si fallan. No se escanea ni cancela información operativa en Render. |
| R8 y reporte | Configuración persistente de minificación/reducción, compilación real, análisis del Release QA con mapping y análisis separado del APK firmado que se distribuye. |

## Evidencias comprobadas

| Comprobación | Resultado y referencia |
| --- | --- |
| Lógica móvil | 174 pruebas aprobadas, 18 suites; lint, TypeScript y 22 comprobaciones de CI. |
| Backend publicado | Ocho comprobaciones funcionales y seis de sesión/privacidad aprobadas contra Render al repetir la verificación. Incluyen Cortes para administrador y rotación/revocación de refresh. |
| CI del código de la app | [Run 40140891972](https://github.com/Josafock/Econolab-Movil/actions/runs/40140891972): aprobado. Semgrep 1.182.1, 65 archivos, cero hallazgos/errores; 16 casos HTTP aprobados. ZAP 2.17.0 registra dos avisos informativos de caché y cero hallazgos de riesgo bajo, medio o alto; las dos observaciones bajas de cabeceras se corrigieron. [Resumen conservado](evidencias-rubrica/SEGURIDAD_CI_ACTUAL.json). Este alcance no equivale a un pentest completo. |
| TLS nativo | [Run 40059121558](https://github.com/Josafock/Econolab-Movil/actions/runs/40059121558): tres casos OkHttp aprobados, incluidos pin incorrecto y respaldo de CA. Esa ejecución falló posteriormente en la interfaz Debug por acceso de Metro; no se presenta como E2E aprobado. |
| Debug/Release en emulador | En curso: [verificación final](https://github.com/Josafock/Econolab-Movil/actions/runs/40141522207). No se acredita como aprobada hasta revisar JUnit, capturas y ambas variantes. |
| APK firmado | [EAS finalizado](https://expo.dev/accounts/dravix117/projects/econolab-mobile/builds/941f3ecb-3c27-47be-8fb0-e494036060ee), [descarga del APK](https://expo.dev/artifacts/eas/NhHBQtUIA85BJc4iyt8UcVw2R2Len2EHAK7AJCKpPk8.apk). SHA-256 `a4c0e527e71d4775fea313d7bc3af5f0f754dd0028167911ff5ffb43a05e1779`. |
| Firma criptográfica | [Run 40136912544](https://github.com/Josafock/Econolab-Movil/actions/runs/40136912544): `apksigner verify` aprobado, firma v2 y un firmante. [Salida conservada](evidencias-rubrica/APK_ACTUAL_FIRMA.txt). |
| R8 del APK distribuible | EAS ejecutó `minifyReleaseWithR8` y terminó `BUILD SUCCESSFUL`. [Extracto del log](evidencias-rubrica/APK_ACTUAL_GRADLE.txt). |
| JADX del APK distribuible | JADX 1.5.6 recuperó 9138 archivos Java; terminó con código 3 y 130 errores parciales de decompilación. [Reporte](evidencias-rubrica/APK_ACTUAL_JADX.json); log completo en el artifact `production-apk-inspection`. No se ocultan los errores ni se afirma que la ofuscación impida recuperar código. |
| Alineación de 16 KB | [Inspección ELF/ZIP](evidencias-rubrica/APK_ACTUAL_16KB.json): 48 bibliotecas ELF de 64 bits y sus entradas ZIP sin comprimir alineadas. No sustituye ejecutar en un dispositivo de 16 KB ni comprobar el AAB de Play. |
| AAB para Google Play | [Descarga 1.1.0, código 5](https://expo.dev/artifacts/eas/wg3M-w2wvV8g5IL6L45URJ2ak9pp9vk6Q-IkCHDnJ4w.aab). [Run 40139058321](https://github.com/Josafock/Econolab-Movil/actions/runs/40139058321): firma de carga, SHA-256, manifiesto y bundletool aprobados; declara PAGE_ALIGNMENT_16K. [Verificación conservada](evidencias-rubrica/AAB_ACTUAL_VERIFICACION.json). No está publicado ni enviado a Play. |
| Metadatos y permisos | [Inspección del APK](evidencias-rubrica/APK_ACTUAL.json): target 36, mínimo 24, no depurable, respaldo y tráfico sin HTTPS desactivados. Internet, red, Wi-Fi y vibración; sin cámara, ubicación, micrófono ni almacenamiento externo. |

La configuración para Metro permite HTTP a `10.0.2.2` únicamente en **QA Debug**. El Release QA conserva su API TLS/pinning y el paquete distribuible no recibe esa excepción. Expo Go y el navegador no acreditan pinning nativo.

## Límites y acciones del equipo

1. **Integración del móvil:** revisar PR58 y respetar las dependencias de las HUs existentes. La cuenta conectada tiene push, pero no administración del repositorio. El propietario debe configurar secrets de integración con Render y reglas de revisión si corresponde; la CI aislada no necesita esos secrets.
2. **Matriz completa y dispositivo propio:** conservar las evidencias automatizadas y completar los casos restantes de [MATRIZ_CAJA_NEGRA.csv](evidencias-rubrica/MATRIZ_CAJA_NEGRA.csv), especialmente Cortes por fecha, pérdida de red, accesibilidad, fuentes grandes y teclado. No marcar un caso nativo aprobado por una prueba Jest o del navegador. El APK QA no sustituye comprobar el APK distribuible en el teléfono del equipo.
3. **Dependencias:** el audit conserva ocho alertas transitivas, cinco altas y tres moderadas, sin críticas. Incluyen herramientas de Expo CLI y la cadena query-string. El Zod directo de la app está actualizado; no se fuerza Zod 4 sobre herramientas que requieren Zod 3 ni se degrada Expo a otra versión mayor. Deben seguirse las actualizaciones compatibles.
4. **Aviso y operación:** revisar proveedores, conservación/respaldos y el proceso real de atención de solicitudes con el laboratorio. El aviso implementado cubre la cuenta de acceso, no certifica cumplimiento legal del laboratorio.
5. **Equipo y Git:** demostrar aportaciones reales y acordar con el docente la exigencia de `develop` frente al flujo oficial actual. No se fabricaron contribuciones, fechas ni ramas retrospectivas.
6. **Google Play:** el titular debe crear/verificar Play Console, realizar sus acuerdos/pago, completar declaraciones y pruebas de distribución. No hay envío ni publicación acreditados. Seguir [la guía actualizada](PUBLICAR_GOOGLE_PLAY.md); el AAB código 5 ya está generado y verificado; su carga y revisión en Play corresponden al titular.

El [registro de incidencias](evidencias-rubrica/INCIDENCIAS_NATIVAS.md) conserva fallos observados y sus correcciones; los runs cancelados no cuentan como aprobados.

Las capturas del equipo deben usar cuentas desechables y evitar datos de pacientes o credenciales. Los artifacts de Actions caducan a los 30 días: descargar y conservar los reportes y capturas necesarios antes de la entrega académica.
