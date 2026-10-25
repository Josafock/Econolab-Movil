# HU08 — pruebas y ejecución

Issue #9; tareas #33 #34 #35. Los datos ficticios se usan en pruebas unitarias y en el entorno Android QA aislado; nunca se incorporan como catálogo o autenticación alternativos de la app de producción. El script habitual de integración utiliza el cliente HTTP y los esquemas de estudios reales de `src`; no levanta otra API ni sustituye el backend.

## Comprobaciones automáticas

- `npm run lint`: ESLint sin warnings permitidos.
- `npm run typecheck`: TypeScript estricto.
- `npm test -- --runInBand`: contratos, filtros, decimales, sesión, SecureStore, concurrencia, validaciones, errores y acceso protegido.
- `npm run build`: bundles Android e iOS mediante Metro/Hermes. No genera APK/IPA.

## Integración real

Completar `.env.integration` local, ignorado por Git, conforme a `.env.integration.example`. La cuenta de pruebas debe ser independiente de usuarios operativos. Ejecutar `npm run test:integration` con backend activo. Para el backend local loopback HTTP, configurar `INTEGRATION_ALLOW_LOCAL_HTTP=1`.

La integración comprueba acceso anónimo rechazado, login válido, perfil actualizado del mismo usuario, paginación, búsqueda/filtros, detalle y revocación del token tras logout, incluido el endpoint de perfil. No altera perfiles, estudios ni contraseñas. Requiere el despliegue de `GET /users/me`: si falta, falla y no omite esa prueba. Si el catálogo está vacío, falla explícitamente: no inventa resultados. No se realizan intentos inválidos de login contra la cuenta real para evitar su bloqueo. No se imprime información de pacientes, tokens o contraseñas.

El workflow integration.yml verifica Render después de una entrega exitosa de main o mediante ejecución manual en main. Requiere secrets INTEGRATION_API_URL, INTEGRATION_EMAIL e INTEGRATION_PASSWORD. En modo automático, si faltan, registra integración pendiente y no acredita una ejecución; una solicitud manual falla. Solo el propietario puede configurarlos. La CI de seguridad aislada sí corre sin esos secrets; utiliza PostgreSQL y credenciales desechables propias.

El workflow_dispatch solo será visible en GitHub cuando el workflow esté integrado por el responsable en la rama predeterminada. Las validaciones push/PR de ci.yml no requieren secretos. Ver [auditoría final](AUDITORIA_FINAL.md) para los resultados de CI y las pruebas realizadas.

## Validación adicional realizada

Se ejecutó una prueba real del cambio de contraseña exclusivamente sobre la cuenta independiente de pruebas: modificar, iniciar sesión con la nueva contraseña y restaurar la original. La restauración y los logout finalizaron correctamente. Esta prueba adicional no forma parte del script habitual porque modifica temporalmente la cuenta.

El 6 de octubre se repitió el recorrido en Chromium: login, dashboard, listado, detalle, búsqueda vacía, perfil, validación, navegación inferior, logout y enlace protegido sin sesión. Se revisaron anchos de 320, 390 y 768 px sin desbordamiento horizontal. La edición de nombre/correo verificó persistencia, contraseña obligatoria para el nuevo correo, saludo actualizado y restauración de los datos originales. Las capturas locales están en `artifacts/01-login.png` a `artifacts/07-profile-edit.png`, ignoradas por Git. Se trata de un preview web, no de evidencia de ejecución Android/iOS.

Login y catálogo usaron Render. Para consultar/editar el perfil, la herramienta externa de QA dirigió las peticiones al módulo Users real compilado del backend local con la misma base existente y la sincronización desactivada; no se simularon respuestas. También reenviaba las peticiones sin Origin por la restricción CORS de localhost. Este montaje de QA no está en la app ni acredita que los endpoints nuevos estén publicados en Render. [Perfil](PROFILE_COMPATIBILITY.md) y [diseño móvil](DISENO_MOVIL.md) explican el alcance.

Las siete comprobaciones del script habitual también pasaron contra AuthModule, UsersModule y StudiesModule reales del backend local, con la base existente, jobs y modificaciones de esquema desactivados. Esta ejecución precedió a la publicación del perfil en Render.

Después de la integración del backend autorizada por el propietario, las siete comprobaciones pasaron también contra Render. La prueba HTTP adicional confirmó guardar nombre/correo, login con el nuevo correo y restauración de la cuenta. Se repitió el formulario móvil con todas las peticiones de datos dirigidas a Render: edición, contraseña requerida para correo, confirmación, saludo actualizado y restauración aprobados. No se usó el servidor local para esta última ejecución; el preview web sigue necesitando la herramienta externa de QA para retirar Origin, por el CORS existente. Los resultados locales anteriores se conservan como historial.

## Pruebas de la versión 1.1

La regresión tiene 179 casos en 19 suites, además de 22 pruebas de CI. La integración contra Render incluye ocho comprobaciones de acceso/perfil/estudios y seis adicionales mediante `npm run test:integration:security` para renovación, rotación y privacidad. Esta última crea y revoca únicamente sus sesiones de prueba; no cancela cuentas del servidor real.

`native-verification.yml` genera Debug y Release QA con los módulos reales del backend en una base desechable. Ejecuta tres casos TLS OkHttp, el recorrido Maestro y JADX. Los resultados aprobados deben obtenerse del run terminado y sus artifacts, no deducirse de la configuración. Release QA no usa la firma del titular ni se distribuye en Play.

`inspect-apk.yml` verifica con apksigner el APK EAS distribuible, compara su SHA-256 y ejecuta JADX sobre ese mismo archivo. No sustituye la ejecución de la interfaz en Android ni la revisión de Play Console.

## Evidencia Android de octubre

[Run aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/40229958547), [metadatos, capturas y JUnit](evidencias-rubrica/OCTUBRE_2026.json). Dos recorridos completos en Android 15: normal y compacto con texto 1.3. La comparación de las fuentes confirma que el APK 6 contiene el mismo código de aplicación que se probó. La firma del paquete se verificó por separado.

## Prueba en dispositivo del equipo

El [recorrido de octubre](ENTREGA_OCTUBRE_2026.md) usa `october-verification.yml`, separado de la matriz integral de noviembre. Compila Release QA y verifica acceso, estudios, Cortes, edición de perfil, ayuda, Atrás y logout en dos configuraciones del emulador Android 15, con texto 1.0 y 1.3. Su fixture crea datos sintéticos en módulos auténticos del backend y PostgreSQL desechable; no consulta ni modifica Render. El artifact contiene JUnit y capturas por configuración. Solo un run terminado con ambos recorridos aprobados acredita esa ejecución; una compilación correcta no basta.

Instalar el APK propio de la versión 1.1 y comprobar login, consentimiento, catálogo, filtros, detalle, perfil, preferencias y logout. Expo Go sirve para interfaz, pero no acredita pinning ni R8. Repetir con red desconectada y con una sesión revocada. Comprobar tamaño de texto y teclado en Android/iOS. El preview web y los bundles compilados complementan esta prueba, pero no sustituyen una ejecución física. Las capturas de la entrega deben proceder de esas ejecuciones reales.
