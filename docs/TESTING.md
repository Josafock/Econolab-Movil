# HU08 — pruebas y ejecución

Issue #9; tareas #33 #34 #35. Datos ficticios se usan solamente en pruebas unitarias aisladas, nunca como catálogo o autenticación de la app. El script de integración utiliza el cliente HTTP y los esquemas de estudios reales de `src`; no levanta otra API ni sustituye el backend.

## Comprobaciones automáticas

- `npm run lint`: ESLint sin warnings permitidos.
- `npm run typecheck`: TypeScript estricto.
- `npm test -- --runInBand`: contratos, filtros, decimales, sesión, SecureStore, concurrencia, validaciones, errores y acceso protegido.
- `npm run build`: bundles Android e iOS mediante Metro/Hermes. No genera APK/IPA.

## Integración real

Completar `.env.integration` local, ignorado por Git, conforme a `.env.integration.example`. La cuenta de pruebas debe ser independiente de usuarios operativos. Ejecutar `npm run test:integration` con backend activo. Para el backend local loopback HTTP, configurar `INTEGRATION_ALLOW_LOCAL_HTTP=1`.

La integración comprueba acceso anónimo rechazado, login válido, paginación, búsqueda/filtros, detalle y revocación del token tras logout. No altera estudios ni contraseñas. Si el catálogo está vacío, falla explícitamente: no inventa resultados. No se realizan intentos inválidos contra la cuenta real para evitar su bloqueo. No se imprime información de pacientes, tokens o contraseñas.

El workflow integration.yml se activa con tags sprint-01 a sprint-06 y con workflow_dispatch. Solo el responsable decide cuándo emitir esos tags; no se crearon durante el desarrollo. Necesita secrets INTEGRATION_API_URL, INTEGRATION_EMAIL e INTEGRATION_PASSWORD que apunten a un backend HTTPS accesible desde GitHub. Una URL `127.0.0.1` del equipo del usuario no es accesible desde el runner; no subir esas credenciales como si fueran un entorno publicado. Faltan secrets → job falla claramente, nunca pasa como omitido.

El workflow_dispatch solo será visible en GitHub cuando el workflow esté integrado por el responsable en la rama predeterminada. Las validaciones push/PR de ci.yml no requieren secretos. Ver [auditoría final](AUDITORIA_FINAL.md) para los resultados de CI y las pruebas realizadas.

## Validación adicional realizada

Se ejecutó una prueba real del cambio de contraseña exclusivamente sobre la cuenta independiente de pruebas: modificar, iniciar sesión con la nueva contraseña y restaurar la original. La restauración y los logout finalizaron correctamente. Esta prueba adicional no forma parte del script habitual porque modifica temporalmente la cuenta.

El 6 de octubre se repitió el recorrido en Chromium con Render real: login, dashboard, listado, detalle, búsqueda vacía, perfil, validación, navegación inferior, logout y enlace protegido sin sesión. Se revisaron anchos de 320, 390 y 768 px sin desbordamiento horizontal. Las capturas locales están en `artifacts/01-login.png` a `artifacts/06-profile.png`, ignoradas por Git. Se trata de un preview web, no de evidencia de ejecución Android/iOS. La herramienta de QA externa reenviaba las peticiones reales sin Origin por la restricción CORS de localhost; [diseño móvil](DISENO_MOVIL.md) explica el alcance.

## Prueba en dispositivo pendiente del equipo

Abrir Expo Go compatible con SDK57 o una compilación de desarrollo, comprobar login, catálogo, filtros, detalle, volver, perfil y logout. Repetir con red desconectada y con una sesión revocada. Comprobar tamaño de texto y teclado en Android/iOS. El preview web y los bundles compilados complementan esta prueba, pero no sustituyen una ejecución física. Las capturas de la entrega deben proceder de esas ejecuciones reales.
