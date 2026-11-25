# Pulido y preparación de publicación

Fecha: 20 de octubre de 2026. Rama `fix/HU-08-publicacion-play-store`, basada en la entrega de Cortes. Se conservan las issues y los Sprints oficiales; no se crean HUs, no se cambian fechas ni estados y la integración del móvil queda a cargo del propietario.

## Trazabilidad

| HU existente | Ajustes de esta entrega |
| --- | --- |
| HU02, issue #2, tareas #15–#18 | Ayuda pública, pantalla para enlaces inexistentes, campos de contraseña accesibles y márgenes seguros |
| HU03, issue #3, tareas #19–#21 | No borrar una contraseña al corregir el correo antes de enviarlo; limpiar avisos al editar; regreso explícito al acceso |
| HU06, issue #7, tareas #28–#29 | Mostrar/ocultar contraseñas, navegación con teclado, confirmación, bloqueo de solicitudes duplicadas y cancelación al salir |
| HU07, issue #8, tareas #30–#32 | Primer error relevante por campo, cancelación de solicitudes y enlaces públicos validados |
| HU08, issue #9, tareas #33–#38 | Regresión, perfiles APK/AAB, comprobación de publicación en CI/EAS y guía de Google Play |

La versión visible pasa a 1.0.0 como preparación. El perfil EAS de producción genera AAB, incrementa el código de compilación y usa el backend real. El APK de pruebas abre sin Expo Go ni Metro. La compilación firmada todavía debe solicitarse desde la cuenta de Expo del responsable.

## Verificación

- 147 pruebas de aplicación en 12 suites y 19 de CI/configuración.
- ESLint y TypeScript sin errores; exportación de bundles Android/iOS.
- Expo Doctor: 21 de 21 comprobaciones. Versiones recomendadas del SDK 57 tras aplicar siete actualizaciones compatibles; React Native no cambia.
- Ocho comprobaciones de integración contra Render: acceso anónimo, login, perfil, corte administrativo, listado/paginación, búsqueda/filtros, detalle y revocación.
- Revisión en navegador con ancho de 320, 390 y 768 px: ayuda sin login, validación del acceso, cuenta real, perfil, visibilidad de contraseñas y regreso desde una ruta inexistente. Las peticiones se enviaron al servidor real; el ajuste de Origin existe solo en el script externo de QA porque Render no permite localhost. No se modifica CORS ni se incorpora un proxy a la app.
- Prebuild Android en una carpeta aislada: icono, splash, identificador y directivas para excluir permisos de cámara, audio, almacenamiento y superposición que no usan los módulos actuales.
- Ambos perfiles EAS validados con el esquema de EAS CLI 25.3.0. Comprobadas las exclusiones de `.env` privados, credenciales y carpetas nativas en `.easignore`.
- Recursos de la ficha: icono opaco de 512 × 512 y gráfico opaco de 1024 × 500, derivados de la marca original.

El prebuild y la exportación de JavaScript **no compilan, firman ni ejecutan un APK/AAB**. Las capturas de QA están ignoradas por Git y no sustituyen las capturas del APK que se usarán en la tienda.

## Pendiente del responsable antes de publicar

1. Vincular Expo (`eas init`) y mantener control de la cuenta y de la firma.
2. Publicar la política real, definir soporte y configurar sus dos variables públicas en los entornos de Expo. `release:check --store` indica esos pendientes y el proyecto EAS faltante; no oculta el fallo.
3. Revisar las 57 alertas documentadas en [DEPENDENCIES.md](DEPENDENCIES.md), incluyendo la dependencia de decodificación en la cadena de navegación; no se declaró una auditoría de seguridad limpia ni se aplicaron cambios mayores incompatibles.
4. Generar APK, probarlo en Android físico y revisar el AAB final, incluido el nivel API 36 y compatibilidad con páginas de 16 KB.
5. Completar ficha, acceso seguro de revisión, privacidad, datos, declaración de salud y pruebas requeridas por Google; después solicitar producción.

Consulta la [guía paso a paso](PUBLICAR_GOOGLE_PLAY.md). No se creó una cuenta, no se contrató una compilación ni se envió una publicación a Google Play.

## Corrección del hook de EAS — 21/10/2026

La primera compilación preview del propietario falló en `PRE_INSTALL_HOOK`: la comprobación rechazaba la carpeta `android`, aunque EAS solo había conservado el directorio vacío. Se reprodujo el problema con `eas build:inspect --stage archive`, verificando que no había archivos de Gradle, manifiesto Android ni `.env.integration` en ese paquete. Se eliminó únicamente esa condición; el hook sigue rechazando credenciales privadas y manteniendo los requisitos de publicación. Dos pruebas ejecutan el script real en directorios temporales: permiten las carpetas nativas vacías y rechazan un archivo de credenciales sin mostrar su contenido. El conjunto de CI/configuración pasa de 19 a 21 pruebas. La vinculación de Expo creada por el propietario se conserva en su copia local.
