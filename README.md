# ECONOLAB móvil

Aplicación React Native con Expo SDK 57 y TypeScript. Reutiliza la API NestJS existente de ECONOLAB para iniciar sesión, consultar estudios y cambiar la contraseña. No incluye otro backend ni otra base de datos.

## Ejecutar

1. Usar Node 24 LTS (`.nvmrc`).
2. Ejecutar `npm ci` dentro de `mobile`.
3. En una instalación nueva, copiar `.env.example` a `.env` y completar `EXPO_PUBLIC_API_URL` con la base del backend, incluido `/api`.
4. Ejecutar `npm start` y escanear el QR con Expo Go compatible con SDK 57. El arranque usa un túnel; mantener computadora e internet disponibles. `npm run start:lan` permite usar la misma red Wi-Fi. `npm run android` requiere un emulador o teléfono Android configurado.

En un teléfono, `localhost` apunta al propio teléfono: para un backend local utiliza la IP de la computadora en la misma red. Android Emulator usa `10.0.2.2`. HTTP se permite durante desarrollo; la versión publicada requiere HTTPS. El preview web necesita un origen autorizado por el CORS existente del backend; la prueba local se ejecutó con `npx expo start --web --port 5173`.

La app está configurada con `https://backend-econolab-escuela-1.onrender.com/api`; no necesita iniciar el backend local. La copia de trabajo tiene una cuenta independiente válida para ese servidor en `.env.integration`. Esos archivos son privados y están ignorados por Git. Nunca subirlos, imprimir la contraseña o incluirla en capturas. Render restringe los orígenes localhost del preview web; utiliza Expo Go para probar el acceso con datos.

## Funcionalidades

- Login, sesión almacenada con SecureStore en Android/iOS, restauración validada, expiración y logout con revocación.
- Dashboard con acceso a estudios y perfil; pantallas protegidas.
- Logo original de la web, tarjetas con la paleta de Econolab y navegación inferior entre Inicio, Estudios y Perfil.
- Catálogo real con búsqueda, filtros, paginación, actualización y detalle con precios y parámetros disponibles.
- Nombre, correo y rol recibidos en el login; cambio de contraseña mediante el endpoint existente.
- Validaciones y mensajes para errores de red, timeout, sesión, permisos y respuestas inesperadas.

El backend no ofrece una consulta actualizada ni edición de nombre/correo del usuario actual. Esos campos permanecen en lectura. [Compatibilidad del perfil](docs/PROFILE_COMPATIBILITY.md) describe el pendiente de HU06.

## Validación

`npm run verify` ejecuta lint, TypeScript, pruebas y exportación Metro Android/iOS. `npm run build` verifica los bundles nativos; no genera APK/IPA ni sustituye una prueba en dispositivo.

`npm run test:integration` usa `.env.integration` contra el backend real. Los campos de ejemplo están en `.env.integration.example`. Para loopback HTTP local, se requiere `INTEGRATION_ALLOW_LOCAL_HTTP=1`. La integración habitual no modifica estudios ni contraseñas.

## Planificación y entrega

Las issues y el Project de [Econolab-Movil](https://github.com/Josafock/Econolab-Movil) son la planificación oficial. Cada HU tiene su rama y PR hacia `main`; las ramas dependientes incluyen el código de las anteriores. El responsable integra los PR según sus sprints. No se realizaron merges ni cambios de calendario.

La implementación completa está en `feature/HU-08-pruebas`, disponible localmente y en el remoto. `main` conserva el estado original por instrucción del proyecto.

## Documentación

- [Auditoría final](docs/AUDITORIA_FINAL.md): resultados, trazabilidad, CI y pendientes reales.
- [Conexión actual a Render](docs/CONEXION_RENDER.md): dirección publicada, túnel, pruebas reales y CORS del preview.
- [Diseño móvil actualizado](docs/DISENO_MOVIL.md): identidad de la web, pantallas y revisión visual del 6 de octubre.
- [Arquitectura](docs/ARCHITECTURE.md): estructura y contratos comprobados.
- [Git](docs/GIT.md): issues, sub-issues, ramas y dependencias.
- [Wireframes](docs/WIREFRAMES.md): distribución e identidad visual.
- [Perfil](docs/PROFILE_COMPATIBILITY.md): operaciones disponibles y limitación del backend.
- [Errores](docs/ERRORS.md): validación y recuperación.
- [Pruebas](docs/TESTING.md): comandos, integración y revisión en dispositivo.
