# Econolab Aula — edición administrativa escolar

Cambio de alcance iniciado el 6 de noviembre de 2026 a petición de David tras la respuesta de Google Play que exige organización para la edición médica. No es un cambio cosmético de categorías.

## Comportamiento actual
- Catálogo genérico editable: impresión, encuadernado y asesoría de informática.
- Búsqueda, alta, pausa y reactivación de servicios de práctica.
- Registro de cantidades y fechas, historial y cancelación con confirmación.
- Cortes por fecha para administradores. Importes de práctica, no cobros.
- Cuenta, perfil, cambio de contraseña, sesión segura, consentimiento y eliminación.
- Cada usuario tiene su propio espacio persistido en PostgreSQL, sin recuperar tablas del dominio anterior.
- Marca Econolab Aula, icono E y textos de práctica escolar.
- No se incorpora un conmutador ni un modo oculto que abra funciones retiradas.
- Los enlaces antiguos /studies redirigen al catálogo genérico. No abren las pantallas anteriores.

La validación de sesión y la comprobación de contraseña incorrecta usan /users/me. La política schoolPathAllowed bloquea solicitudes a rutas del dominio anterior antes de usar fetch. Las páginas públicas y el consentimiento usan /school/privacy.

## Conservación del proyecto original y planeación
La edición original y su entrega de octubre permanecen en el historial y la rama feature/HU-08-evidencias-octubre. Las clases originales conservadas para regresión no se importan desde la navegación actual y no aparecen en los paquetes exportados. Main de mobile no se mezcla automáticamente.

Este cambio de noviembre se documenta como mantenimiento de alcance en HU-08 y afecta catálogo, inicio, cortes y publicación. No se inventan Sprints, fechas, aportaciones o estados de tareas. El nuevo catálogo genérico sustituye la consulta de análisis de la edición anterior; el profesor debe aceptar esa modificación del alcance académico. Las evidencias anteriores no se presentan como pruebas de esta edición.

## Patrones
- Singleton de módulo: src/core/api.ts.
- Factory: createSchoolViewModel en src/features/school/SchoolViewModel.ts.
- Repository: SchoolRepository y HttpSchoolRepository.
- Observer: ObservableState y useSyncExternalStore en SchoolProvider.
- MVVM: Screens (vista), SchoolViewModel (estado), ManageWorkspace (reglas), repositorio HTTP.

## Comandos
1. npm run lint
2. npm run typecheck
3. npm test -- --runInBand
4. node --test tests/ci/*.test.cjs
5. npm run release:check -- --store
6. npm run build -- --source-maps --output-dir artifacts/school/export
7. node scripts/audit-school-bundle.cjs
8. npx eas-cli@25.3.0 build --platform android --profile preview
9. npx eas-cli@25.3.0 build --platform android --profile production

En Windows, si Hermes no puede escribir en el TEMP del sandbox, configura TEMP y TMP de esa terminal a artifacts/school/temp. No se desactiva Hermes para ocultar el fallo.

El app.json local que ya estaba modificado por David conserva sus datos de Expo. app.config.js aplica la identidad Aula sin cambiar esos valores ni el nombre de paquete com.econolab.mobile. EAS incrementa versionCode de manera remota.

## Backend y privacidad
Se necesita desplegar SchoolModule en el backend antes de distribuir el binario. Si las rutas nuevas responden 404, la app muestra un error y no recurre al catálogo anterior.

Aviso: https://backend-econolab-escuela-1.onrender.com/api/school/privacy
Eliminación externa: https://backend-econolab-escuela-1.onrender.com/api/school/privacy/account-deletion
Contacto y responsable: Jesús David Saldaña Hernández, 20230009@uthh.edu.mx.

El backend conserva las funciones anteriores para los otros clientes. El espacio Aula es una tabla aditiva con FK a usuario; borrar la cuenta elimina el espacio de práctica por cascada. El acceso a la cuenta se comparte con otros clientes del servidor y su eliminación también cancela ese acceso.

## Play Console: aplicar al binario nuevo
No reenviar únicamente la descripción ni volver a distribuir el AAB anterior.
1. Subir el AAB Aula con un código superior al último usado en Play (el rechazo mostrado correspondía al código 8).
2. Actualizar el nombre a Econolab Aula, el icono, el gráfico, capturas reales de esta edición y descripción.
3. Categoría propuesta según sus funciones: Productividad. Esta propuesta no es una clasificación aprobada por Google.
4. Sustituir los enlaces de privacidad y eliminación por los de /school/privacy.
5. Revisar íntegramente la declaración de salud. Para esta edición sin funciones ni datos de salud corresponde declarar el alcance efectivo; la opción oficial es Mi aplicación no proporciona funciones de salud. No declarar investigaciones, prevención ni servicios médicos que esta versión ya no ofrece.
6. Revisar Seguridad de los datos: siguen transmitiéndose nombre, correo, credenciales, registros de sesión y datos de práctica al servidor. No marcar que no se recopilan datos.
7. Mantener una cuenta de revisión válida y con acceso a todos los módulos. Explicar en inglés cómo crear una actividad y consultar cortes.
8. Revisar las otras pistas y retirar de distribución las versiones anteriores que mantengan el alcance rechazado. No eliminar la evidencia histórica de los rechazos.
9. Informar a soporte del rediseño real y solicitar la reevaluación del nuevo binario. Conservar el número del caso.

Fuentes oficiales:
https://support.google.com/googleplay/android-developer/answer/14738291?hl=es
https://support.google.com/googleplay/android-developer/answer/10788890?hl=es

## Texto para la ficha
Nombre: Econolab Aula
Descripción breve: Practica la organización de servicios y consulta resúmenes por fecha.

Descripción completa:
Econolab Aula es un proyecto escolar para practicar tareas de organización administrativa.

Crea un catálogo de servicios genéricos, busca elementos y cambia su disponibilidad. Registra actividades con una cantidad y una fecha, consulta el historial y cancela ejercicios cuando necesites corregirlos. Los administradores pueden consultar resúmenes por periodo.

Cada cuenta dispone de su propio espacio de práctica. El catálogo inicial contiene ejemplos de impresión, encuadernado y asesoría de informática. Introduce únicamente datos ficticios en los ejercicios. Los importes no representan ventas ni pagos.

También puedes administrar tu perfil, cambiar tu contraseña y gestionar la privacidad y eliminación de tu cuenta. Requiere internet y una cuenta de práctica autorizada.

Recursos: assets/store/aula/icon-512.png y feature-1024x500.png. Las capturas para la tienda deben corresponder a la app nativa nueva instalada; las imágenes de pruebas web no se presentan como capturas Android.

## Mensaje para el caso de soporte
We have redesigned Econolab (com.econolab.mobile) as Econolab Aula, a school application for generic administrative practice. The new binary contains a generic editable service catalog, practice activity records and summaries by date, plus account and privacy functions. The previous domain screens and their API requests have been removed from the distributed navigation and bundles. Each account uses a separate practice workspace. We updated the store listing and declarations to match the new functionality. Please reevaluate the newly submitted version and confirm its classification.

Enviar ese mensaje después de cargar el binario y actualizar realmente la ficha. No afirma que Google ya haya aceptado el cambio.

## Límites de la verificación
Las pruebas y la exclusión de módulos verifican el cambio técnico; no certifican una decisión de Google Play. La aprobación de una cuenta personal y la aceptación del cambio académico dependen de sus respectivos revisores.
