# Corregir el envío de Econolab

Actualización: 6 de noviembre de 2026. Se conserva el nombre **ECONOLAB**, el logo original, el paquete `com.econolab.mobile` y la cuenta Expo existente. Cambia la funcionalidad a práctica administrativa genérica. No hay un modo oculto para volver a las funciones médicas.

## Archivos actuales

- [Descargar APK código 11: instalar y probar en Android](https://expo.dev/artifacts/eas/mUq5VL_Ev8fm8UDRNOdXv58BLrK2GqVoHKYNAIlPGZg.apk).
- [Descargar AAB código 12: enviar a Google Play](https://expo.dev/artifacts/eas/tWbKKlKCWYwf4vXbCKUVc4kwtpvjv7KIGbgXmueKgMw.aab).

Ambos finalizaron correctamente en Expo y se descargaron con comprobación SHA-256 e integridad ZIP. Consulta [la evidencia](evidencias-marca/RESULTADO_2026-11-06.json). No uses los códigos 9 y 10: corresponden a la identidad temporal Aula y quedan como evidencia histórica. No hace falta crear otra aplicación en Play Console ni cambiar el identificador.

## Antes de enviar

Instala el APK 11. Comprueba inicio de sesión, consentimiento, catálogo, registro y cancelación de actividades, cortes por fecha con cuenta administradora, perfil y privacidad. Toma capturas reales desde ese teléfono para la ficha. Las capturas web con API simulada del repositorio son pruebas técnicas, no capturas Android.

## Pasos en Play Console

1. Abre **Econolab → Contenido de la aplicación → Aplicaciones de salud → Administrar**. Retira las selecciones de investigación, prevención y administración médica. Para esta nueva versión, que no ofrece funciones ni accede a datos de salud, selecciona **Mi aplicación no proporciona funciones de salud**. Si no aparece, revisa el formulario completo; no selecciones una función médica solo para poder guardar. [Instrucción oficial](https://support.google.com/googleplay/android-developer/answer/14738291?hl=es).
2. En **Configuración de la tienda**, la categoría propuesta por sus funciones actuales es **Productividad**. Conserva **Econolab** y su icono original. Actualiza descripción, gráfico y capturas para mostrar el catálogo genérico, las actividades y los cortes de práctica. Usa `assets/store/icon-512.png` y `assets/store/feature-1024x500.png`.
3. Actualiza la URL de privacidad a [este aviso público](https://backend-econolab-escuela-1.onrender.com/api/school/privacy) y la URL de eliminación a [esta página pública](https://backend-econolab-escuela-1.onrender.com/api/school/privacy/account-deletion).
4. Revisa **Seguridad de los datos** y **Acceso a la aplicación**. La cuenta y el espacio de práctica siguen usando el servidor: no declares que no se recopila ningún dato. Proporciona a Google una cuenta de revisión válida y las instrucciones de acceso, incluyendo el rol administrador para los cortes. No publiques sus credenciales en GitHub ni en la ficha.
5. Ve a **Prueba cerrada → Alpha → Gestionar canal** y prepara una versión con el **AAB código 12**. Excluye de esa versión los bundles antiguos. Si un borrador pendiente impide crear la versión, quita los cambios pendientes y descarta ese borrador siguiendo lo que indique la consola. No borres la evidencia de los rechazos. [Guía oficial de versiones](https://support.google.com/googleplay/android-developer/answer/9859348?hl=es).
6. Revisa las demás pistas para evitar que sigan distribuyendo el alcance anterior. En **Descripción general de la publicación**, envía a revisión el binario nuevo y los cambios de declaraciones y ficha juntos.
7. Responde en el caso de soporte existente con el mensaje de abajo. Es una solicitud de reevaluación por un cambio funcional real; no una excepción por tratarse de una tarea escolar.

## Texto para la ficha

**Nombre:** Econolab

**Descripción breve:** Organiza servicios de práctica y consulta resúmenes por fecha.

**Descripción completa:** Econolab es un proyecto escolar para practicar la organización de servicios. Permite administrar un catálogo genérico, registrar actividades con cantidades y fechas, consultar el historial y cancelar ejercicios. Los administradores pueden consultar resúmenes por periodo. Cada cuenta tiene su propio espacio de práctica, con ejemplos de impresión, encuadernado y asesoría de informática. Usa únicamente datos ficticios; los importes no representan pagos. Incluye perfil, cambio de contraseña y opciones de privacidad y eliminación de cuenta. Requiere internet y una cuenta autorizada.

**Notas de la versión:**

```text
<es-419>
Actualización de Econolab para práctica administrativa escolar: catálogo genérico, actividades y resúmenes por fecha. Se conserva el nombre y logo originales. Se actualizan el aviso de privacidad y el alcance de las funciones.
</es-419>
```

## Mensaje para soporte, después de cargar el AAB 12

```text
Hello Google Play Developer Support,

We have redesigned Econolab (com.econolab.mobile) and submitted version 1.1.0, version code 12. The app keeps its original name and logo. Its distributed functionality is now generic administrative practice: a service catalog, activity records with quantities and dates, cancellations and summaries, plus account and privacy settings. This version does not provide healthcare services or access health data. The previous medical modules are excluded from its navigation and bundles; there is no switch to enable them.

We have updated the Health apps declaration, store listing, screenshots and privacy links to match this new binary. Please reevaluate this version and confirm whether the new scope can be distributed through our personal developer account.

Thank you.
```

Envía ese texto únicamente cuando hayas realizado esos cambios. Google decide la clasificación y aprobación después de revisar la nueva versión. La aprobación de la prueba cerrada tampoco equivale al acceso automático a producción.
