# ECONOLAB móvil

Aplicación React Native con Expo SDK 57 y TypeScript. Reutiliza la API NestJS existente de ECONOLAB para iniciar sesión, consultar estudios, gestionar el perfil y cambiar la contraseña. No incluye otro backend ni otra base de datos.

## Ejecutar

1. Usar Node 24 LTS (`.nvmrc`).
2. Ejecutar `npm ci` dentro de `mobile`.
3. En una instalación nueva, copiar `.env.example` a `.env` y completar `EXPO_PUBLIC_API_URL` con la base del backend, incluido `/api`.
4. Ejecutar `npm start` y escanear el QR con Expo Go compatible con SDK 57. El arranque usa un túnel; mantener computadora e internet disponibles. `npm run start:lan` permite usar la misma red Wi-Fi. `npm run android` requiere un emulador o teléfono Android configurado.

La distribución usa HTTPS y pinning nativo con Render. Expo Go permite revisar interfaz, pero no acredita pinning. El Debug QA permite HTTP a `10.0.2.2` solo para Metro; su API conserva TLS y pinning. El preview web necesita un origen autorizado por el CORS del backend.

La app está configurada con `https://backend-econolab-escuela-1.onrender.com/api`; no necesita iniciar el backend local. La copia de trabajo tiene una cuenta independiente válida para ese servidor en `.env.integration`. Esos archivos son privados y están ignorados por Git. Nunca subirlos, imprimir la contraseña o incluirla en capturas. Render restringe los orígenes localhost del preview web; utiliza Expo Go para probar el acceso con datos.

## Funcionalidades

- Login, SecureStore en Android/iOS, JWT corto, renovación agrupada ante 401 y logout con revocación.
- Consentimiento explícito, aviso público, preferencias opcionales y cancelación de la cuenta propia desde Privacidad y mis datos.
- Dashboard con acceso a estudios y perfil; pantallas protegidas.
- Cortes por fecha para administradores: periodo/sucursal, importes reales registrados, cancelaciones, desglose diario y detalle paginado. [Alcance y planeación de Cortes](docs/CORTES.md).
- Logo original de la web en las pantallas, icono nativo de ECONOLAB, tarjetas con su paleta y navegación inferior entre Inicio, Estudios y Perfil.
- Catálogo real con búsqueda, filtros, paginación, actualización y detalle con precios y parámetros disponibles.
- Perfil actualizado desde el backend, edición de nombre/correo con confirmación de contraseña al cambiar correo; rol protegido y cambio de contraseña.
- Validaciones y mensajes para errores de red, timeout, sesión, permisos y respuestas inesperadas.
- Ayuda y uso de datos desde el acceso y el perfil; política de privacidad y soporte enlazables mediante configuración pública.

El perfil utiliza `GET/PATCH /api/users/me` del backend existente. El PR1 del backend está integrado con autorización del propietario y la consulta/edición se verificaron en Render. [Compatibilidad del perfil](docs/PROFILE_COMPATIBILITY.md) describe los contratos y las pruebas de publicación.

## Validación

`npm run verify` ejecuta lint, TypeScript, pruebas y exportación Metro Android/iOS. `npm run build` verifica los bundles nativos; no genera APK/IPA ni sustituye una prueba en dispositivo.

`npm run test:integration` usa `.env.integration` contra el backend real. Los campos de ejemplo están en `.env.integration.example`. Para loopback HTTP local, se requiere `INTEGRATION_ALLOW_LOCAL_HTTP=1`. La integración habitual no modifica estudios ni contraseñas.

## Planificación y entrega

Las issues y el Project de [Econolab-Movil](https://github.com/Josafock/Econolab-Movil) son la planificación oficial. Cada HU tiene su rama y PR hacia `main`; las ramas dependientes incluyen el código de las anteriores. El responsable integra los PR según sus sprints. No se realizaron merges en el móvil ni cambios de calendario. El propietario autorizó integrar únicamente el backend para habilitar el perfil.

La entrega 1.1 está en `fix/HU-08-seguridad-rubrica`, [PR58](https://github.com/Josafock/Econolab-Movil/pull/58), basada en el pulido de publicación y Cortes. Se conserva el `main` integrado por el propietario y la integración de los PR queda a su cargo, sin cambiar el calendario del Project. El backend de sesión y privacidad sí se integró con autorización del usuario.

## Documentación

- [Cambios técnicos de la versión 1.1](docs/SEGURIDAD_Y_PRIVACIDAD.md): renovación de sesión, pinning, privacidad, R8 y comprobaciones del CI.
- [Diagnóstico anterior a la versión 1.1](docs/REVISION_RUBRICA_2026-10-23.md): historial de los 15 criterios; los cambios posteriores están en Seguridad y privacidad.
- [Evidencias de la rúbrica](docs/evidencias-rubrica/GUIA_EVIDENCIAS.md): capturas necesarias y matriz para pruebas nativas Debug/Release.
- [Auditoría histórica de octubre](docs/AUDITORIA_FINAL.md): conservar como historial; consultar la revisión actual para pruebas, APK, dependencias y estado del repositorio.
- [Conexión actual a Render](docs/CONEXION_RENDER.md): dirección publicada, túnel, pruebas reales y CORS del preview.
- [Diseño móvil actualizado](docs/DISENO_MOVIL.md): identidad de la web, pantallas y revisión visual del 6 de octubre.
- [Icono de la aplicación](docs/ICONOS.md): recursos originales, generación nativa y cómo verlo al instalar la app.
- [Arquitectura](docs/ARCHITECTURE.md): estructura y contratos comprobados.
- [Git](docs/GIT.md): issues, sub-issues, ramas y dependencias.
- [Verificación del Project](docs/PROJECT_VERIFICATION.md): campos, seis Sprints y asignaciones oficiales comprobadas.
- [Cortes por fecha](docs/CORTES.md): HU04, permisos, contrato real, alcance contable y pruebas.
- [Wireframes](docs/WIREFRAMES.md): distribución e identidad visual.
- [Perfil](docs/PROFILE_COMPATIBILITY.md): contratos implementados y publicación verificada en Render.
- [Errores](docs/ERRORS.md): validación y recuperación.
- [Pruebas](docs/TESTING.md): comandos, integración y revisión en dispositivo.


## CI/CD por issue

Push y Pull Request ejecutan regresión y checks por HU. Después del merge, main valida el conjunto y entrega artifacts. Consulta [workflows, cobertura y entornos](docs/GITHUB_ACTIONS.md).
- [Publicar en Google Play paso a paso](docs/PUBLICAR_GOOGLE_PLAY.md): cuentas, APK, AAB, ficha, privacidad, pruebas y producción.
- [Pulido y preparación de publicación](docs/PULIDO_PUBLICACION.md): cambios, pruebas, trazabilidad y pendientes del responsable.
- [Revisión de privacidad](docs/PRIVACIDAD_PENDIENTES.md): datos confirmados y procesos externos que el responsable debe revisar.
