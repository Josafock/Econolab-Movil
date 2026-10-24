# Información que debe completar el responsable

Esta lista ayuda a preparar la política de ECONOLAB; **no es una política publicada ni un texto legal aprobado**.

1. Nombre del responsable que controla las cuentas y el servicio, correo de soporte y medio para solicitudes sobre datos.
2. URL HTTPS pública de la política, sin login ni PDF. Enlazarla también desde la app mediante `EXPO_PUBLIC_PRIVACY_URL` y en Play Console.
3. Datos usados: cuenta (nombre, correo, identificador, rol), credenciales para autenticar, sesión y operaciones que el servidor registre. Confirmar registros técnicos, direcciones IP, copias de seguridad, datos administrativos de servicios y proveedores del backend.
4. Finalidades: acceso del personal, permisos, consulta del catálogo, perfil y resumen de servicios por fecha. Explicar por separado cualquier otra finalidad real del servidor o SDK.
5. Proveedores y destinatarios: alojamiento de Render, proveedor real de base de datos, correo y otros servicios utilizados. Confirmar qué reciben, para qué y si existen transferencias de datos.
6. Plazos reales de conservación, incluyendo cuentas desactivadas, registros y respaldos. No prometer borrado inmediato si no existe el mecanismo.
7. Forma de solicitar acceso, corrección y eliminación; verificar identidad y explicar las retenciones justificadas. No confundir desactivar la cuenta con eliminar sus datos.
8. Revisar si el registro web está integrado en el flujo móvil. Si habilita creación de cuentas desde la app, implementar las vías de eliminación requeridas antes de publicar.
9. Fecha, alcance de la política y un proceso para mantenerla actualizada si cambia la aplicación.

Comportamiento observado en el móvil: transporte HTTPS de producción; sesión en SecureStore Android/iOS; no guarda la contraseña; sin registro móvil, anuncios, analítica propia ni lectura de cámara, micrófono o ubicación en los módulos actuales. Esto describe el código inspeccionado, no sustituye revisar los servicios externos ni el binario final.

Fuentes: [datos de usuarios](https://support.google.com/googleplay/android-developer/answer/10144311), [formulario de Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469), [eliminación de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111).
