# HU06 — perfil real y edición

Issue #7; consulta #28 y edición #29. Actualización: 6 de octubre de 2026, a solicitud expresa del propietario para completar los endpoints pendientes.

La app consulta `GET /api/users/me` al abrir el perfil y mediante «Actualizar perfil». Lee únicamente id, nombre, email y rol del usuario autenticado. El formulario permite editar nombre y correo; rol e ID no se envían ni son editables. `PATCH /api/users/me` devuelve los datos persistidos y la interfaz los muestra al guardar. El saludo del inicio se actualiza con el nombre nuevo.

Nombre de 2–50 caracteres, correo válido hasta 50; ambos límites coinciden con las columnas existentes. Cambiar correo requiere confirmar la contraseña actual y se comprueba que no esté registrado. La app valida antes de enviar, pide confirmar el guardado, limpia la contraseña tras el intento y distingue correo duplicado, error de password y sesión expirada.

Los endpoints se implementaron en el backend existente, [PR1](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/1). Reutilizan Users, JWT, guards y base existente. No crean una API o base paralela ni modifican el esquema. El propietario autorizó integrar el backend el 6 de octubre; el PR quedó en `main` mediante el commit `933215a`. La validación de `main` se habilitó en `35d9fb7`. La autorización se limita al backend: `main` y los PR del móvil permanecen sin merges.

La identidad vigente recibida del perfil se guarda en el contexto de la app, separada de la instantánea firmada del login. No se altera el JWT ni se guarda una identidad incompatible con sus claims en SecureStore. Al volver a consultar se obtienen los datos reales; una respuesta de otra cuenta o de una sesión anterior se rechaza.

Se conserva `PATCH /api/users/update-password` con current_password y password. Un 401 puede significar contraseña actual incorrecta o sesión inválida; se comprueba la sesión mediante el catálogo antes de clasificarlo. Ese patrón también se aplica a la confirmación del cambio de correo.

## Validación y publicación

104 pruebas móviles aprobadas; build Android/iOS y lint/TypeScript aprobados. CI del PR49 aprobado. Backend: 22 pruebas nuevas y 52 pruebas completas aprobadas, con CI y SonarCloud aprobados. Prueba HTTP real con la base existente: consulta, campos protegidos, cambio de nombre/correo, login nuevo, restauración y revocación. También pasaron las siete comprobaciones del script de integración contra los módulos Auth, Users y Studies reales ejecutados localmente. Solo se usó la cuenta independiente de pruebas.

El perfil está publicado y comprobado en `https://backend-econolab-escuela-1.onrender.com/api`. Las siete comprobaciones de integración de la app pasaron contra ese servidor. La prueba HTTP real verificó consulta, rechazo de campos protegidos, contraseña obligatoria para cambiar correo, persistencia de nombre/correo, login con el correo nuevo, restauración y revocación. El servidor completo devuelve 401 en consulta anónima y su middleware CSRF rechaza la escritura anónima con 403; las peticiones autenticadas Bearer conservan la validación JWT.

El formulario móvil también pasó en Chromium usando únicamente Render para todas las peticiones de datos: guardar nombre/correo, confirmación, saludo actualizado, volver al perfil, restaurar los datos originales y logout. La herramienta externa de QA retiró Origin por el CORS de localhost; no redirigió el perfil a un backend local ni simuló respuestas. El CI del backend en `main` pasó en [run 37564684292](https://github.com/DavidHdz117/Backend_Econolab_Escuela/actions/runs/37564684292). Esto acredita publicación y funcionamiento del contrato; la ejecución física Android/iOS sigue a cargo del equipo. Los estados oficiales de HU06 y su Sprint no se modificaron.
