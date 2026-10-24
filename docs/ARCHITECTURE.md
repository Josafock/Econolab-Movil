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

Los endpoints de perfil del [PR1 del backend](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/1) están implementados, probados e integrados con autorización del propietario; su consulta y edición se verificaron contra Render publicado. El cliente valida que la respuesta corresponda al ID autenticado. El perfil actualizado vive separado de la identidad firmada del login en el contexto, evitando modificar los claims del JWT o invalidar la restauración de SecureStore. No hay refresh token. Consultar `GET /studies?limit=1&page=1` permite distinguir contraseña incorrecta de sesión revocada cuando una edición devuelve 401. Ver [perfil](PROFILE_COMPATIBILITY.md).

El cliente nativo no requiere cookies ni cambios CORS. El preview web sí requiere que su origen esté autorizado por la configuración existente del servidor. El backend sigue siendo la autoridad sobre roles y sesiones.

`npm run build` exporta bundles Android/iOS para verificar compilación JavaScript/TypeScript con Metro; no produce APK/IPA ni acredita prueba física.
# Actualización de arquitectura 1.1

Se aplica MVVM con límites de Clean Architecture en privacidad y estudios, conservando contratos y adaptadores de los módulos existentes.

```mermaid
flowchart LR
  View[Vista React Native] --> VM[ViewModel observable]
  VM --> UC[Caso de uso]
  UC --> Port[Contrato Repository]
  HTTP[Adaptador HTTP] -. implementa .-> Port
  HTTP --> API[ApiClient compartido]
  Factory[Factory de composición] --> VM
  Factory --> HTTP
```

| Patrón | Implementación real | Propósito |
| --- | --- | --- |
| Singleton de módulo | `src/core/api.ts`: instancia exportada `api` | Transporte y coordinación de renovación compartidos. Se permiten instancias independientes para pruebas. |
| Factory | `createPrivacyViewModel`, `createStudiesViewModel`; `createSession` valida la sesión | Componer adaptadores/casos de uso e impedir sesiones locales inconsistentes. |
| Repository | Contratos `PrivacyRepository` y `StudyRepository`; adaptadores `HttpPrivacyRepository` y `HttpStudyRepository` | Sustituir transporte por dobles de prueba sin convertir la vista en un cliente HTTP. |
| Observer | `ObservableState.subscribe/getSnapshot`; vistas con `useSyncExternalStore` | Notificar estado y cancelar suscripciones sin acoplar casos de uso a React. |

`ManagePrivacy` y `SearchStudies` representan reglas de aplicación. Los ViewModels controlan carga, cancelación, respuestas tardías y presentación; las vistas controlan interacción y distribución visual. Las pruebas de `/test` utilizan los contratos Repository para comprobar reglas, paginación, consentimiento y carreras de respuestas.

La composición conecta los adaptadores reales al crear los ViewModels. La arquitectura anterior que sigue describe la base del proyecto; no implica que todos los módulos se hayan reescrito como casos de uso separados. [Sesiones, pinning, privacidad y Release](SEGURIDAD_Y_PRIVACIDAD.md).
