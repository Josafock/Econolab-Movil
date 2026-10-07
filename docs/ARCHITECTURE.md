# Arquitectura y contratos comprobados

Expo SDK 57, React Native 0.86 y Expo Router. `src/app` contiene rutas; `src/features` agrupa funcionalidades; `src/core` separa transporte/configuración/validación; `src/ui` comparte componentes. Se reutiliza el backend NestJS existente; la petición posterior de completar el perfil añade dos endpoints en su módulo Users, sin modificar el esquema de la base.

El cliente envía JSON y Bearer, usa timeout, cancela solicitudes y valida respuestas. La URL base es `EXPO_PUBLIC_API_URL` con el prefijo `/api` que ya usa `backend/src/main.ts`. Nunca contiene secretos. Datos públicos del cliente y credenciales del servidor son conceptos distintos.

Contratos leídos del backend local:

| Método y ruta relativa | Entrada / respuesta |
|---|---|
| POST /auth/login | `{email,password}` → `{message,token,usuario:{id,nombre,email,rol}}` |
| POST /auth/logout | Bearer → `{message}`; revoca sesión por jti |
| GET /studies | search, type, status, page, limit → `{data,meta:{page,limit,total}}` |
| GET /studies/:id | Estudio directo |
| GET /studies/:id/details | Arreglo de parámetros/categorías |
| PATCH /users/update-password | `{current_password,password}` → `{message}` |
| GET /users/me | Bearer → `{id,nombre,email,rol}` del usuario autenticado |
| PATCH /users/me | `{nombre?,email?,current_password?}` → `{message,usuario:{id,nombre,email,rol}}`; contraseña actual obligatoria al cambiar correo |

Fuentes: backend/src/auth/auth.controller.ts, auth.service.ts, strategies/jwt.strategy.ts; studies/studies.controller.ts y studies.service.ts; users/users.controller.ts, user-profile.controller.ts y user-profile.service.ts; common/filters/http-exception-zod.filter.ts.

Los endpoints de perfil del [PR1 del backend](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/1) están implementados y probados; necesitan integración y despliegue para estar disponibles en Render. El cliente valida que la respuesta corresponda al ID autenticado. El perfil actualizado vive separado de la identidad firmada del login en el contexto, evitando modificar los claims del JWT o invalidar la restauración de SecureStore. No hay refresh token. Consultar `GET /studies?limit=1&page=1` permite distinguir contraseña incorrecta de sesión revocada cuando una edición devuelve 401. Ver [perfil](PROFILE_COMPATIBILITY.md).

El cliente nativo no requiere cookies ni cambios CORS. El preview web sí requiere que su origen esté autorizado por la configuración existente del servidor. El backend sigue siendo la autoridad sobre roles y sesiones.

`npm run build` exporta bundles Android/iOS para verificar compilación JavaScript/TypeScript con Metro; no produce APK/IPA ni acredita prueba física.
