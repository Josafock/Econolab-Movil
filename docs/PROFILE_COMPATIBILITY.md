# HU06 — perfil real y edición

Issue #7; consulta #28 y edición #29. Actualización: 6 de octubre de 2026, a solicitud expresa del propietario para completar los endpoints pendientes.

La app consulta `GET /api/users/me` al abrir el perfil y mediante «Actualizar perfil». Lee únicamente id, nombre, email y rol del usuario autenticado. El formulario permite editar nombre y correo; rol e ID no se envían ni son editables. `PATCH /api/users/me` devuelve los datos persistidos y la interfaz los muestra al guardar. El saludo del inicio se actualiza con el nombre nuevo.

Nombre de 2–50 caracteres, correo válido hasta 50; ambos límites coinciden con las columnas existentes. Cambiar correo requiere confirmar la contraseña actual y se comprueba que no esté registrado. La app valida antes de enviar, pide confirmar el guardado, limpia la contraseña tras el intento y distingue correo duplicado, error de password y sesión expirada.

Los endpoints se implementaron en el backend existente, [PR1](https://github.com/DavidHdz117/Backend_Econolab_Escuela/pull/1). Reutilizan Users, JWT, guards y base existente. No crean una API o base paralela ni modifican el esquema. Esta autorización posterior sustituye el bloqueo anterior para añadir esa capacidad; los cambios permanecen en ramas y PR sin integración automática.

La identidad vigente recibida del perfil se guarda en el contexto de la app, separada de la instantánea firmada del login. No se altera el JWT ni se guarda una identidad incompatible con sus claims en SecureStore. Al volver a consultar se obtienen los datos reales; una respuesta de otra cuenta o de una sesión anterior se rechaza.

Se conserva `PATCH /api/users/update-password` con current_password y password. Un 401 puede significar contraseña actual incorrecta o sesión inválida; se comprueba la sesión mediante el catálogo antes de clasificarlo. Ese patrón también se aplica a la confirmación del cambio de correo.

## Validación y publicación

104 pruebas móviles aprobadas; build Android/iOS y lint/TypeScript aprobados. CI del PR49 aprobado. Backend: 22 pruebas nuevas y 52 pruebas completas aprobadas, con CI y SonarCloud aprobados. Prueba HTTP real con la base existente: consulta, campos protegidos, cambio de nombre/correo, login nuevo, restauración y revocación. También pasaron las siete comprobaciones del script de integración contra los módulos Auth, Users y Studies reales ejecutados localmente. Solo se usó la cuenta independiente de pruebas.

Para habilitar el perfil en Render se debe integrar y desplegar el PR de backend. La prueba local no acredita publicación. Si ese servidor todavía no tiene los endpoints, la app muestra un error de consulta y no ofrece un guardado ficticio. La integración automática ahora exige la lectura real del perfil; no omite ese contrato. Los estados oficiales de HU06 y su Sprint siguen a cargo del responsable.
