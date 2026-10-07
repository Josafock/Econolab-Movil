# HU07 — errores y validaciones

Issue #8; tareas #30 #31 #32.

El cliente valida entrada en login, filtros/identificadores de estudios y contraseña. Los formularios indican el campo que necesita corrección. Toda respuesta de datos se comprueba con Zod antes de usarla.

HTTP400/422: datos inválidos;401: sesión revocada/expirada y retorno al login;403: acceso denegado;404: recurso no disponible;429: espera y reintento;5xx: servicio temporalmente no disponible. El login convierte401/404 en un único mensaje de credenciales. El cambio de contraseña distingue401 por contraseña actual errónea de una sesión inválida usando un endpoint de lectura real.

Los errores de red y timeout tienen mensajes propios. El timeout es15segundos; las búsquedas anteriores se cancelan y se descartan respuestas tardías. No se muestra el cuerpo de un error del servidor ni stack traces, mensajes de excepciones desconocidas, contraseñas o tokens. AbortError no genera mensajes al cambiar una búsqueda o salir de pantalla.

El indicador de red es informativo: no impide conexión a un servidor de la misma LAN. Los errores de restaurar la sesión bloquean las pantallas y ofrecen reintento/cierre local. Un error de SecureStore nunca se convierte silenciosamente en una sesión persistida.

El ErrorBoundary de Expo Router muestra una pantalla recuperable en lugar de detalles internos. Ninguna pantalla usa datos mock para ocultar errores del backend.
