# Entrega de octubre de Econolab móvil

Revisión del **25 de octubre de 2026**. Equipo: Jesús David Saldaña Hernández (`DavidHdz117`) y Kristofer (`Josafock`). React Native 0.86, Expo SDK 57 y TypeScript. Grupo confirmado de David: **10° A**.

La página 2 del Instrumento Integral de Evaluación Móvil asigna **10 puntos** a octubre: actividad 5, repositorio y versionamiento, con fecha 22/10; actividad 4, interfaces y arquitectura, con fecha 29/10. Esta entrega documenta los siete criterios; la calificación y la aceptación de la entrega de la actividad 5 después del día 22 corresponden al docente. Las fechas del Project no se modifican.

## Relación con los siete criterios

| Criterio y valor | Implementación y evidencia |
| --- | --- |
| A5.1 Versionamiento · 1 punto | `main`, `develop`, ramas `feature/*` y `fix/*`; [PR59 hacia develop](https://github.com/Josafock/Econolab-Movil/pull/59). [Flujo vigente y trazabilidad](GIT.md). `develop` se creó el 25/10 desde main, sin reconstruir el pasado. |
| A5.2 SAST y DAST · 1 punto | [Seguridad CI](../.github/workflows/security.yml): Semgrep, auditoría de dependencias, 16 aserciones HTTP sobre backend real aislado y ZAP. La compilación de octubre depende de estos trabajos. [Resumen de escaneos](evidencias-rubrica/SEGURIDAD_CI_ACTUAL.json). Cero críticos; los ocho avisos transitivos no críticos siguen documentados. |
| A5.3 Estructura y aportaciones · 1 punto | Código por funcionalidades en `src/features`, rutas en `src/app`, infraestructura en `src/core`, componentes en `src/ui` y pruebas en `/test` y `/tests`. [Aportaciones de ambos integrantes](APORTACIONES_EQUIPO_OCTUBRE.md), con commits y PR. La valoración del equilibrio del trabajo requiere explicación del equipo. |
| A4.1 Interfaces móviles · 2 puntos | Acceso, Inicio, Estudios, precios/parámetros, Cortes, Perfil y Ayuda, además de Privacidad. No son maquetas estáticas: consumen los contratos reales de la API. |
| A4.2 Arquitectura y patrones · 2 puntos | [Diagrama y archivos de implementación](ARCHITECTURE.md). MVVM/Clean explícito en Estudios y Privacidad. Singleton en API, Factory de composición, Repository HTTP y Observer de estado. |
| A4.3 Caja blanca · 1.5 puntos | 179 pruebas, 19 suites; 22 comprobaciones de CI. [Pruebas en /test](../test): casos de uso, ViewModels, sesión, privacidad y pinning; la regresión de pantallas/API se conserva en `/tests`. |
| A4.4 Navegación y UX · 1.5 puntos | [Recorrido reproducible](../.maestro/october-navigation.yml) en Android, con dos tamaños y texto ampliado. Ambos recorridos aprobaron en [esta ejecución](https://github.com/Josafock/Econolab-Movil/actions/runs/40229958547); [JUnit, capturas y metadatos](evidencias-rubrica/OCTUBRE_2026.json). |

## Resultado comprobado

[Android aprobado](https://github.com/Josafock/Econolab-Movil/actions/runs/40229958547): recorrido completo en tamaño normal y compacto con texto 1.3. El correo se mantuvo visible con el teclado abierto; se comprobaron catálogo, precios, parámetros, Cortes por $135.50, edición con nombre exacto, Ayuda, Atrás y logout. Son configuraciones del emulador Android 15, con datos ficticios en backend real aislado.

[Regresión aprobada](https://github.com/Josafock/Econolab-Movil/actions/runs/40229958561): 179 pruebas en 19 suites, 22 comprobaciones de CI, lint y TypeScript. Semgrep revisó 66 archivos sin hallazgos ni errores; los 16 casos HTTP aprobaron y ZAP solo registró dos observaciones informativas. Las ocho alertas transitivas no críticas siguen documentadas.

El APK 6 corresponde al mismo código de aplicación probado; la diferencia de commits posteriores está en automatización/documentación. No se acredita una prueba física ni la matriz integral Debug/Release de noviembre.

## Recorrido de octubre

[Workflow de Android](../.github/workflows/october-verification.yml), [ejecución inicial](https://github.com/Josafock/Econolab-Movil/actions/runs/40221241203). Utiliza módulos auténticos del backend fijados al commit `8634ba3dc1071703cb263622809b3fe244acd026`, PostgreSQL desechable y cuentas/datos ficticios. No modifica Render ni sustituye sus respuestas por mocks.

El mismo recorrido prueba los siguientes puntos en Android 15:

1. Acceso con teclado, aceptación inicial cuando corresponde e Inicio.
2. Búsqueda del catálogo, precio conocido de $120.00 y parámetro del estudio; Atrás al listado.
3. Cortes con dos servicios incluidos, uno cancelado y neto esperado de $135.50. El importe cancelado de $45.00 queda fuera del neto.
4. Edición del nombre de la cuenta de prueba con confirmación y respuesta del servidor.
5. Ayuda, regreso al Perfil, regreso al Inicio y cierre de sesión confirmado.

Configuraciones: 1080 × 2400 píxeles a 420 dpi, texto 1.0; y 720 × 1280 a 320 dpi, texto 1.3. Son dos configuraciones de un emulador, no dos teléfonos físicos. Los resultados se registran por separado en JUnit y las capturas se guardan en `octubre-navegacion-android` durante 90 días. El paquete QA tiene identificador propio y certificado de servidor de prueba; no es el APK que se entrega al laboratorio.

## Archivos para presentar

- Este documento y el [reporte Word de octubre](entregables/Reporte_octubre_Econolab.docx).
- Enlace al repositorio y al PR59; mostrar el selector de ramas con `main`, `develop` y `feature/HU-08-evidencias-octubre`.
- [Arquitectura](ARCHITECTURE.md), [aportaciones](APORTACIONES_EQUIPO_OCTUBRE.md), carpeta `/test` y resultados CI.
- Capturas y JUnit de la ejecución Android de octubre aprobada. Conservar el artifact localmente antes de que expire.
- APK firmado 1.1.0, **código 6**, disponible desde [la descarga de Expo](https://expo.dev/artifacts/eas/NLVl_tl1b0FQUKpFBAAypHZEF3Y8E-H1_8AtwIJcJTI.apk). Incluye la corrección del formulario bajo el teclado Android. [Metadatos](evidencias-rubrica/APK_OCTUBRE.json) y [verificación criptográfica](evidencias-rubrica/APK_OCTUBRE_VERIFICACION.json). Su firma coincide con la del APK anterior, permitiendo la actualización. No confundirlo con el APK QA utilizado en el emulador.

## Comprobaciones del equipo antes de entregar

Ambos integrantes deben revisar la tabla de aportaciones y poder explicar su parte. Kristofer puede revisar el PR59 con su propia cuenta y registrar observaciones; no hay una revisión suya acreditada todavía. Instalar el APK en el teléfono que se llevará a clase, entrar con una cuenta autorizada del laboratorio y practicar el recorrido. Las pruebas del emulador no se presentan como una prueba física.

Conservar los estados reales: un run fallido o una prueba no ejecutada no se marca como aprobado. No se marca como cerrada la matriz completa Debug/Release de noviembre por aprobar el recorrido de octubre.

## Lo que corresponde a noviembre

Las actividades 6 y 7 vencen el 26/11. Incluyen evidencia integral de pinning/cifrado, ARCO, R8/JADX, matriz de caja negra en Debug y Release, publicación en Play, ejecutable firmado y permisos. Su estado detallado permanece en [la revisión completa](REVISION_RUBRICA_2026-10-25.md); tener pendientes de noviembre no significa que las interfaces y pruebas de octubre no estén implementadas.
