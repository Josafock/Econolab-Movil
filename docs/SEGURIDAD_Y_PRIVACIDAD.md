# Seguridad y privacidad de ECONOLAB 1.1

Trabajo relacionado con las HUs existentes 01, 02, 03, 05, 06, 07 y 08. El Project y sus Sprints mantienen sus fechas, responsables y estados. Las modificaciones del móvil se revisan mediante PR; no se integra `main` desde esta entrega.

## Sesión y almacenamiento

El login móvil solicita el contrato extendido del backend existente: JWT de acceso de 15 minutos y credencial opaca de renovación, con vencimiento absoluto de sesión de 30 días. Access y refresh se guardan exclusivamente mediante SecureStore nativo, con política de dispositivo desbloqueado y sin conservar la contraseña. El respaldo Android está desactivado en la configuración persistente; SecureStore mantiene también sus exclusiones.

El cliente agrupa respuestas 401 concurrentes, renueva una sola vez y repite cada petición como máximo una vez. Una respuesta de una cuenta anterior no se vuelve a enviar con las credenciales de una cuenta nueva. La persistencia y los contadores de operaciones impiden restaurar la sesión después de cerrar sesión. El logout revoca por refresh aunque haya vencido el access JWT.

La reutilización de un refresh consumido revoca su familia en el servidor. Un corte de red después de rotar y antes de recibir/guardar la respuesta puede exigir iniciar sesión nuevamente: no se conserva la contraseña para evitarlo.

## Certificate pinning

`config/pinning.json` contiene hashes SHA-256 del SPKI, no el hash del archivo APK. Se observaron por conexión TLS con validación de confianza y hostname el 24/10/2026 UTC (23/10 en Ciudad de México): clave del certificado `onrender.com`, intermedia Google Trust Services WE1 y GTS Root R4.

`src/core/pinning.ts` inicializa `react-native-ssl-public-key-pinning` antes de las consultas de API. El módulo utiliza OkHttp CertificatePinner en Android y TrustKit en iOS. La configuración se aplica al hostname exacto, sin incluir subdominios y sin fecha que desactive automáticamente la protección. Si no existe el módulo nativo o falla la activación, se bloquea el transporte; no se hace fallback a una petición sin pinning.

Los pins de CA permiten renovar certificados administrados por Render dentro de esa cadena. Su alcance es más amplio que fijar exclusivamente una clave de servidor controlada por el proyecto; **no se declara protección frente a toda emisión indebida de la misma CA**. Si Render cambia de cadena, comprobar la nueva cadena por medios confiables, actualizar pins y distribuir una versión antes de retirar los anteriores. No reemplazar automáticamente pins solo porque una conexión falló.

Expo Go sirve para revisar interfaz en desarrollo, pero no incluye este módulo y no acredita pinning. La demostración de seguridad requiere el APK propio. La vista web depende del TLS del navegador y tampoco se presenta como una prueba de pinning nativo.

## Privacidad de la cuenta

El usuario confirmó como responsable de atender solicitudes a **Jesús David Saldaña Hernández**, correo **20230009@uthh.edu.mx**.

- Aviso público: `https://backend-econolab-escuela-1.onrender.com/api/privacy`.
- Solicitud externa de cancelación: `https://backend-econolab-escuela-1.onrender.com/api/privacy/account-deletion`.
- La pantalla **Privacidad y mis datos** muestra el aviso. La aceptación empieza desmarcada; se registra expresamente con versión y fecha del servidor antes de permitir el acceso a las pantallas de trabajo.
- Comunicaciones y analítica opcionales comienzan desactivadas. La decisión puede cambiarse y se persiste en el servidor. Esta versión no envía campañas ni integra un SDK de analítica opcional.
- El perfil permite acceso y rectificación de nombre/correo; cambiar correo requiere contraseña actual.
- La cancelación propia requiere contraseña, frase exacta y confirmación adicional. Se protege al último administrador, también ante cambios de rol concurrentes. La cancelación elimina la cuenta de acceso y sus registros asociados, **sin borrar expedientes clínicos**. Para esos datos se requiere atención por el laboratorio.

El aviso describe el alcance técnico de la cuenta móvil. El responsable debe revisar sus procesos y el aviso específico del laboratorio; no se presenta como una certificación legal.

## Release y permisos

`app.config.js` y `plugins/with-security-verification.js` son configuración de origen para Expo/CNG. Activan minificación R8, reducción de recursos y reglas ProGuard; utilizan `proguard-android-optimize.txt`. No se depende de editar una carpeta Android generada que EAS después descarta.

Se bloquean micrófono, cámara, almacenamiento externo, ventanas superpuestas y biometría no utilizada. Los permisos normales de internet/estado de red/vibración que puedan incorporar las dependencias deben revisarse en el manifiesto final; no generan un diálogo de permisos peligrosos. No se agregan permisos únicamente para producir capturas académicas.

La versión de publicación usa `com.econolab.mobile`. El entorno de emulador utiliza **com.econolab.mobile.qa**, cuentas desechables y un certificado exclusivo de pruebas. No se permite compilar ese entorno como perfil `production` de EAS. El APK QA no sustituye el APK/AAB firmado del titular para distribución.

## CI y evidencias

- `security.yml`: Semgrep fijado a 1.182.1, reglas locales para código dinámico, TLS, almacenamiento y exposición de credenciales, más `npm audit` bloqueando severidad crítica. El análisis estático tiene un alcance definido; no garantiza ausencia de vulnerabilidades.
- El mismo workflow levanta PostgreSQL y los módulos reales de autenticación, perfil, privacidad y estudios del backend en un entorno aislado. Ejecuta pruebas HTTP de seguridad y OWASP ZAP 2.17.0 contra el aviso público. No escanea ni modifica datos del servidor de Render.
- La contraseña de PostgreSQL es aleatoria por ejecución y se enmascara en logs; no se guarda una contraseña estática en los workflows.
- El pipeline de entrega depende del resultado de seguridad. Si falla o se omite, el build y el reporte obligatorio no pueden quedar aprobados.
- `native-verification.yml`: genera builds QA Debug/Release, ejecuta tres pruebas OkHttp de TLS real (pins válidos, respaldo de CA y pin incorrecto), usa Maestro 2.11.0 en emulador y ejecuta JADX 1.5.6 sobre el Release. Conserva logs, JUnit, capturas y un reporte con SHA-256, mapping y límites del análisis. **Configurar un workflow no equivale a haberlo ejecutado:** su resultado debe adjuntarse desde Actions.
- Las pruebas nuevas de lógica están en `/test`; las anteriores permanecen en `/tests`. La regresión ejecuta ambas.

El Zod usado directamente por la app se actualizó a 4.6.7. La cadena de Expo CLI todavía utiliza Zod 3 y conserva avisos transitivos; también quedan avisos de node-forge y decode-uri-component. No se fuerza una sustitución incompatible del CLI o de Expo para obtener un número menor en `npm audit`. Conservar el JSON de la ejecución actual y el seguimiento de esas dependencias.

## Lo que sigue dependiendo del titular/equipo

Cuenta y verificación de Play Console, acuerdos y registro; participantes reales de prueba cerrada cuando corresponda; revisión del aviso y de las solicitudes recibidas; aceptación del docente sobre `develop`; aportes reales del equipo y aceptación de Sprints/PR. La configuración de secrets y reglas del repositorio puede requerir al propietario: la cuenta conectada tiene permiso de push en el móvil, pero no de administración.
