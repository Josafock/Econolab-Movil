# Privacidad: datos confirmados y revisión del responsable

Actualización: 24 de octubre de 2026. Responsable confirmado para las solicitudes sobre la cuenta móvil: **Jesús David Saldaña Hernández**, **20230009@uthh.edu.mx**.

El [aviso público](https://backend-econolab-escuela-1.onrender.com/api/privacy) y la [vía externa de cancelación](https://backend-econolab-escuela-1.onrender.com/api/privacy/account-deletion) ya están publicados. Los perfiles EAS preview/production y la app tienen el contacto y el enlace configurados.

## Implementado

- Aceptación explícita inicialmente desmarcada, con versión y fecha del servidor; se exige antes de las pantallas de trabajo.
- Consulta y rectificación del perfil. Cambiar correo requiere contraseña actual.
- Preferencias opcionales desactivadas inicialmente y oposición persistida. Esta versión no incorpora campañas ni un SDK de analítica opcional.
- Cancelación de la cuenta propia con contraseña, frase y confirmación. Elimina cuenta, sesiones, preferencias y registros de acceso vinculados; protege al último administrador.
- Credenciales de sesión en SecureStore, sin guardar contraseñas. HTTPS y pinning en el APK propio. Respaldo Android desactivado.

La cancelación de la cuenta móvil **no elimina expedientes clínicos ni servicios del laboratorio**. El aviso distingue este alcance; las solicitudes sobre esos datos deben ser atendidas por el laboratorio.

## Revisión que corresponde al responsable

1. Confirmar que tiene autorización para atender solicitudes de las cuentas del servicio y revisar el correo publicado. Mantener un procedimiento de verificación de identidad, respuesta y seguimiento.
2. Confirmar proveedores reales de base de datos, correo y alojamiento, destinatarios, conservación y tratamiento de respaldos. No prometer eliminación de respaldos que el proveedor todavía conserva.
3. Revisar el aviso técnico y el aviso del laboratorio con quien corresponda. El código y este documento no certifican cumplimiento legal ni determinan obligaciones de conservación clínica.
4. Responder Seguridad de los datos y eliminación de cuentas en Play Console según la versión distribuida y las prácticas reales del servidor. No declarar que no se recopilan datos por usar HTTPS.
5. Actualizar aviso y configuración cuando cambien finalidades, datos, contacto o proveedores. Un cambio de versión del aviso exige nueva aceptación en la app.

Fuentes de publicación: [datos de usuarios](https://support.google.com/googleplay/android-developer/answer/10144311), [Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469), [eliminación de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111).
