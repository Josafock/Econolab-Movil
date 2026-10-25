# Publicar ECONOLAB en Google Play

Guía actualizada el **24 de octubre de 2026**. Los nombres de algunos menús pueden variar según el idioma de Play Console.

**Actualización del 25/10:** el [APK código 6](evidencias-rubrica/APK_OCTUBRE.json) incorpora la corrección del teclado Android. El AAB código 5 descrito abajo corresponde a la compilación anterior; antes de enviarlo a Play, generar un AAB nuevo desde el código actualizado y repetir las comprobaciones de distribución. Publicar sigue siendo una actividad de noviembre; el APK de octubre no acredita un envío a revisión.

## Qué ya está preparado

- Expo SDK 57, marca original, icono y pantalla de arranque.
- `eas.json`: `preview` genera **APK** instalable y `production` genera **AAB** para Google Play. Ambos usan el backend real de Render con `/api` y HTTPS.
- Versión visible `1.1.0`. El APK de esta entrega tiene `versionCode` 4; EAS incrementa los códigos futuros.
- `.easignore` excluye credenciales, archivos `.env` privados, capturas, resultados y carpetas nativas generadas. EAS genera Android desde `app.json`.
- Ayuda, privacidad y soporte configurados. Responsable de solicitudes de la cuenta: Jesús David Saldaña Hernández, `20230009@uthh.edu.mx`.
- `assets/store/icon-512.png` y `feature-1024x500.png` para la ficha. Se regeneran con `npm run generate:store-assets`.

Ya existe un [APK 1.1.0 firmado en EAS](https://expo.dev/accounts/dravix117/projects/econolab-mobile/builds/941f3ecb-3c27-47be-8fb0-e494036060ee). **No acredita envío ni publicación en Google Play.** Falta completar Play Console, sus declaraciones y las pruebas del equipo. Consulta los resultados actuales en [Seguridad y privacidad](SEGURIDAD_Y_PRIVACIDAD.md).

## 1. Abrir la carpeta correcta

En PowerShell:

```powershell
Set-Location 'C:\Users\David\OneDrive\Documentos\Econolab escuela\mobile'
git status
node --version
npm ci
npm run verify
npm run release:check
```

Usa Node 24 LTS. La entrega está en `fix/HU-08-seguridad-rubrica` e incluye Cortes y seguridad. El responsable revisa e integra el PR según sus Sprints antes de publicar.

## 2. Crear las cuentas

1. La copia local ya está vinculada al proyecto Expo de `dravix117`; conserva su acceso y firma. En otra computadora inicia sesión con esa cuenta autorizada. Solo crea otro proyecto si el titular decide trasladar la app.
2. Entra a [Google Play Console](https://play.google.com/console/signup). Google exige al menos 18 años, cobra **25 USD una sola vez** y solicita verificación de identidad. Elige cuenta personal u organización según el responsable real; no uses datos ficticios. Las cuentas personales nuevas también requieren verificar un dispositivo Android con la app de Play Console. [Registro oficial](https://support.google.com/googleplay/android-developer/answer/6112435).
3. Si el responsable es la escuela o el laboratorio, acuerda quién conservará la cuenta, los accesos y la firma para futuras actualizaciones.

EAS Build tiene cuotas y planes: revisa los límites que aparezcan en tu cuenta antes de solicitar la compilación. No necesitas contratar automáticamente un plan de pago. [EAS Build](https://docs.expo.dev/build/setup/).

## 3. Vincular la app con Expo

Dentro de `mobile`:

```powershell
npx eas-cli@25.3.0 login
npx eas-cli@25.3.0 whoami
npx eas-cli@25.3.0 init
```

La copia local ya tiene el `extra.eas.projectId` real. Ejecuta `init` solo al vincular una copia que todavía no lo tenga; conserva el proyecto existente, su firma y `eas.json`. [Configuración oficial](https://docs.expo.dev/build/setup/).

El identificador Android actual es **`com.econolab.mobile`**. Confirma que será el definitivo y que Play Console lo acepta antes de la primera subida. Si pertenece a otra aplicación tendrás que elegir uno propio en `app.json` y volver a compilar. Google trata el nombre de paquete como permanente. [Crear una app](https://support.google.com/googleplay/android-developer/answer/9859152).

## 4. Completar privacidad y soporte

El aviso ya está publicado en [Privacidad de ECONOLAB](https://backend-econolab-escuela-1.onrender.com/api/privacy), sin login y en HTML. Revisa que describa los procesos reales del responsable y los proveedores antes de declarar esas prácticas en Play. [Requisito de Google](https://support.google.com/googleplay/android-developer/answer/10144311).

Consulta [la revisión del responsable](PRIVACIDAD_PENDIENTES.md). El aviso técnico no sustituye revisar las prácticas del laboratorio.

Agrega los valores verdaderos a tu `.env` local, conservando la URL existente del backend:

```dotenv
EXPO_PUBLIC_API_URL=https://backend-econolab-escuela-1.onrender.com/api
EXPO_PUBLIC_PRIVACY_URL=https://backend-econolab-escuela-1.onrender.com/api/privacy
EXPO_PUBLIC_SUPPORT_EMAIL=20230009@uthh.edu.mx
```

Estos valores públicos ya están fijados en `eas.json` para preview/production. No necesitas crear otras variables para repetir esta configuración. Las variables `EXPO_PUBLIC_*` van dentro de la app: nunca pongas secretos ni credenciales de integración ahí. [Variables en EAS](https://docs.expo.dev/eas/environment-variables/).

```powershell
npm run release:check -- --store
```

Este comando comprueba que haya datos configurados; verifica tú que la página publique el texto correcto y que el correo reciba mensajes. El perfil `production` también ejecuta la comprobación antes de compilar y se detiene si faltan esos datos o el proyecto de Expo.

## 5. Generar e instalar el APK de prueba

```powershell
npx eas-cli@25.3.0 build --platform android --profile preview
```

Si EAS pregunta por la firma Android, permite generar una **keystore nueva** únicamente si es la primera firma de esta app. Si ya hubo una publicación, utiliza su clave de carga existente. Conserva un respaldo seguro desde `eas credentials`; no lo subas al repositorio.

Espera a que la compilación termine con éxito. Abre en el teléfono el enlace que entregue Expo, descarga el APK e instálalo. Android puede pedir autorización para instalar desde ese navegador. [APK con EAS](https://docs.expo.dev/build-reference/apk/).

Esta instalación ya tiene el icono propio y abre sin Expo Go, QR de desarrollo ni computadora encendida. Para acceder a los datos sí necesita internet y el backend disponible.

Comprueba con una cuenta de pruebas:

- Login válido e inválido, cierre de sesión, reapertura y expiración.
- Estudios: búsqueda, filtros, páginas, detalle y reintento sin red.
- Perfil: consulta, edición y cambio de contraseña con una cuenta de prueba.
- Cortes con administrador y ausencia del módulo para recepción. Usa una fecha con servicios para revisar el resumen.
- Teclado, botón Atrás, textos grandes, orientación vertical e icono al iniciar.
- Sin internet debe aparecer un aviso claro, nunca una cifra de corte inventada.

Si instalas luego desde Google Play y Android reporta firma incompatible con el APK de prueba, desinstala el APK y vuelve a instalar desde la pista de pruebas. Se perderá la sesión local. Play App Signing puede usar una firma de distribución distinta de la clave de carga.

## 6. Crear la ficha de ECONOLAB

En Play Console → **Crear aplicación**, elige español, nombre **ECONOLAB**, tipo aplicación y la modalidad de precio que hayas decidido. Completa las declaraciones que solicite la consola. [Configuración de la app](https://support.google.com/googleplay/android-developer/answer/9859152).

Textos propuestos según las funciones actuales:

**Descripción breve:** `Consulta estudios, gestiona tu perfil y revisa cortes por fecha en Econolab.`

**Descripción completa:**

> ECONOLAB permite al personal autorizado consultar el catálogo de estudios del laboratorio, revisar sus detalles y mantener actualizados su nombre, correo y contraseña. Los administradores también pueden consultar resúmenes de servicios por fecha y sucursal, con importes y cancelaciones. Los cortes muestran servicios registrados; no confirman pagos ni efectivo recibido. Requiere una cuenta de Econolab y conexión a internet. La app no realiza diagnósticos ni sustituye la atención de un profesional de salud.

Agrega un correo de soporte atendido y el sitio real del laboratorio. Usa estos archivos en la ficha:

| Campo | Archivo o preparación |
| --- | --- |
| Icono | `assets/store/icon-512.png`, PNG de 512 × 512 |
| Gráfico de funciones | `assets/store/feature-1024x500.png`, PNG de 1024 × 500 |
| Capturas | Como mínimo dos capturas reales de la app instalada; se sugieren Inicio, Estudios, Cortes y Perfil |

Para las capturas, usa una cuenta y datos de demostración. Evita nombres de pacientes, correos personales, contraseñas y registros financieros reales. Tómalas desde el APK, no de Expo Go ni de un diseño inventado. Revisa dimensiones en la consola; JPEG/PNG sin transparencia, entre 320 y 3840 px, con el lado mayor de hasta el doble del menor. [Recursos gráficos oficiales](https://support.google.com/googleplay/android-developer/answer/9866151).

## 7. Completar «Contenido de la aplicación»

En **Política y programas → Contenido de la aplicación**, completa los apartados que aparezcan:

1. **Política de privacidad:** coloca la misma URL real configurada dentro de la app.
2. **Acceso a la app:** informa que requiere login. Proporciona a Google una cuenta de revisión funcional y las instrucciones para llegar a Estudios, Perfil y Cortes. La cuenta debe permitir revisar todos los módulos; no entregues acceso administrativo a información real de pacientes ni publiques la contraseña en GitHub. Configura un entorno con datos seguros y la misma funcionalidad si hace falta. [Acceso para revisión](https://support.google.com/googleplay/android-developer/answer/15748846).
3. **Anuncios:** en el código actual no hay anuncios; responde según la versión que finalmente publiques.
4. **Público objetivo y clasificación de contenido:** responde los cuestionarios según el personal al que va dirigida. No marques una clasificación de edad sin completar el formulario.
5. **Seguridad de los datos:** declara las prácticas reales. El código transmite nombre, correo, identificador de cuenta y credenciales de autenticación; los servicios y cortes se consultan al servidor. Revisa también registros del servidor, proveedores y SDK incluidos. No marques «no se recopilan datos» solo porque usa HTTPS. El responsable debe confirmar las respuestas y la conservación. [Guía de Seguridad de los datos](https://support.google.com/googleplay/android-developer/answer/10787469).
6. **Eliminación de cuentas:** la versión 1.1 permite la cancelación propia en Perfil → Privacidad y mis datos. La vía externa está en `https://backend-econolab-escuela-1.onrender.com/api/privacy/account-deletion`. Elimina cuenta y datos de acceso asociados; no expedientes clínicos. El último administrador debe transferir primero esa responsabilidad. Declara este alcance con exactitud. [Requisitos de eliminación](https://support.google.com/googleplay/android-developer/answer/13327111).
7. **Declaración de salud:** completa el formulario que Google exige, también a apps que declaran no ofrecer funciones de salud. Evalúa el catálogo de laboratorio según las funciones efectivas; no atribuyas diagnósticos ni funcionalidades clínicas que esta app no tiene. [Declaración oficial](https://support.google.com/googleplay/android-developer/answer/14738291).

## 8. Generar el AAB de Google Play

En esta entrega ya se generó el [AAB 1.1.0, código 5](https://expo.dev/artifacts/eas/wg3M-w2wvV8g5IL6L45URJ2ak9pp9vk6Q-IkCHDnJ4w.aab). Su firma, manifiesto, estructura y alineación de empaquetado de 16 KB se verificaron con jarsigner, keytool y bundletool 1.18.3. Este archivo está preparado para la carga manual en tu cuenta de Play Console; no ha sido enviado a revisión.

Los comandos siguientes generan otra compilación cuando cambie la app o su configuración:

```powershell
npm run verify
npm run release:check -- --store
npx eas-cli@25.3.0 build --platform android --profile production
```

Espera el resultado exitoso y descarga el **`.aab`** del enlace de Expo. El AAB no se instala directamente tocándolo en el celular: se sube a Play Console. La exportación `npm run build` solo genera bundles JavaScript y tampoco sustituye al AAB firmado. [Compilación para Play](https://docs.expo.dev/submit/android/).

Para nuevas apps y actualizaciones, al 20/10/2026 Google exige **Android 16 / API 36 o superior**. Expo SDK 57 utiliza API 36 por defecto. Confirma el nivel del AAB en el explorador de Play Console. [Nivel de API requerido](https://support.google.com/googleplay/android-developer/answer/11926878), [SDK 57](https://docs.expo.dev/versions/v57.0.0/).

Revisa también la compatibilidad de las bibliotecas nativas con páginas de memoria de **16 KB** en el AAB. No se puede acreditar esa validación con una exportación de Metro: revisa el resultado de Play Console y prueba en el entorno que indica Android. [Comprobación oficial](https://developer.android.com/guide/practices/page-sizes).

## 9. Subir primero a una pista de pruebas

En Play Console → **Prueba y lanzamiento → Pruebas → Prueba interna**, crea una versión, habilita Play App Signing cuando lo solicite, carga el AAB y agrega notas de la versión. Resuelve los errores que marque la consola, guarda y distribuye a los evaluadores invitados. La primera carga se hace manualmente; no necesitas una clave JSON de cuenta de servicio para este recorrido. [Primera entrega Android](https://docs.expo.dev/submit/android/).

Instala ahora desde el enlace de participación de Google Play y repite el recorrido principal. Revisa los informes de pruebas previas al lanzamiento y los errores de compatibilidad.

Si tu cuenta personal se creó **después del 13 de noviembre de 2023**, necesitas después una **prueba cerrada con al menos 12 evaluadores inscritos durante 14 días consecutivos** para solicitar acceso a producción. La prueba interna no sustituye esta condición. Invita a tus evaluadores en la pista cerrada, asegúrate de que acepten el enlace y usa las pruebas para recoger y corregir problemas. Al cumplir el periodo, solicita acceso a producción y responde sobre las pruebas realizadas. Google revisa la solicitud; cumplir el mínimo no garantiza aprobación automática. [Requisitos de prueba vigentes](https://support.google.com/googleplay/android-developer/answer/14151465).

## 10. Enviar a producción

Cuando tu cuenta tenga acceso a producción y la consola indique que la ficha y declaraciones están completas, crea una versión en **Producción** o promociona la versión ya probada. Selecciona países, revisa disponibilidad y precio, agrega notas y envía los cambios a revisión. Google decidirá si aprueba la publicación o pide correcciones; no hay un tiempo de aprobación garantizado. Comprueba finalmente que la ficha pública permita instalar la app.

## Actualizaciones

Para una actualización, cambia la versión visible en `app.json` y `package.json` de forma consistente, regenera el lockfile correspondiente y repite pruebas, compilación `production` y carga del nuevo AAB. EAS incrementa el `versionCode`; no reutilices el de un AAB anterior. Si ya tienes historial de versiones en otra cuenta/herramienta, inicializa la numeración de EAS con `eas build:version:set` antes de compilar. [Versiones con EAS](https://docs.expo.dev/build-reference/app-versions/).

## Si algo falla

| Problema | Qué revisar |
| --- | --- |
| `release:check --store` marca pendientes | Vincula Expo y completa política/correo reales en `.env`; crea las mismas variables públicas en el entorno production de EAS |
| El APK abre un error de Expo CLI | Comprueba que instalaste el APK preview terminado; el APK independiente no necesita Metro |
| No inicia sesión | Usa una cuenta válida del backend real; verifica internet y que Render responda; nunca uses localhost en la app publicada |
| Google no puede revisar Cortes | Revisa el rol de la cuenta de demostración y las instrucciones de acceso |
| `versionCode` ya usado | Ajusta la numeración remota de EAS para superar el último código subido y genera otro AAB |
| Advertencia de API o 16 KB | Revisa el AAB y sus bibliotecas nativas; no ocultes la advertencia ni cambies versiones mayores sin probar compatibilidad |
| EAS detecta archivos privados | Revisa que se use el `.easignore` de esta entrega y ejecuta desde `mobile` |

Corrección del 21/10/2026: el archivo que prepara EAS puede conservar carpetas vacías, incluido `android`, aunque sus archivos estén correctamente excluidos. Se retiró el bloqueo que trataba su sola existencia como error. Si una copia anterior falla en `Pre-install hook` con «Excluye las carpetas nativas generadas», utiliza el `scripts/check-release.cjs` actualizado y vuelve a compilar. Se mantienen las comprobaciones de credenciales privadas y de configuración para Google Play.

La cuenta Expo fue vinculada por el titular; esta entrega reutiliza su firma Android. No se creó una cuenta de Google, no se realizaron pagos ni se envió la app a Play Console.
