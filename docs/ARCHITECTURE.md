# Arquitectura y contratos comprobados

Expo SDK 57, React Native 0.86 y Expo Router. `src/app` contiene rutas; `src/features` agrupa funcionalidades; `src/core` separa transporte/configuración/validación; `src/ui` comparte componentes. Backend NestJS existente: sin cambios.

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

Fuentes: backend/src/auth/auth.controller.ts, auth.service.ts, strategies/jwt.strategy.ts; studies/studies.controller.ts y studies.service.ts; users/users.controller.ts; common/filters/http-exception-zod.filter.ts.

No hay endpoint de perfil ni refresh token. Los datos personales solo se obtienen en login; no se inventa GET/PATCH /me. HU06 debe documentar esta limitación. Consultar un estudio mediante GET /studies?limit=1&page=1 permite validar una sesión con un endpoint existente, sin duplicar el backend.

El cliente nativo no requiere cookies ni cambios CORS. El preview web sí requiere que su origen esté autorizado por la configuración existente del servidor. El backend sigue siendo la autoridad sobre roles y sesiones.

`npm run build` exporta bundles Android/iOS para verificar compilación JavaScript/TypeScript con Metro; no produce APK/IPA ni acredita prueba física.
