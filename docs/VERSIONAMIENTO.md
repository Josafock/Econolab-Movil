# Estrategia de versionamiento

Econolab usa SemVer `MAJOR.MINOR.PATCH` para la versión visible. MAJOR cambia
ante incompatibilidades públicas; MINOR incorpora funcionalidad compatible;
PATCH corrige defectos compatibles. La base evaluada es 1.1.0. Los cambios de CI
de esta actividad no se presentan como una nueva versión publicada de la app.

`package.json.version` y `app.json.expo.version` deben coincidir. El script
`npm run version:check` verifica el formato y, cuando se recibe una etiqueta
`vX.Y.Z`, exige que identifique esa misma versión. La prueba de CI rechaza
etiquetas que intenten liberar una versión diferente.

Android usa un `versionCode` entero creciente, administrado remotamente por EAS
con `appVersionSource=remote` y `autoIncrement=true`. El número de compilación
no equivale a la versión comercial: APK 1.1.0 código 4 y AAB 1.1.0 código 5
son entregas distintas de la misma versión. Los metadatos históricos deben
confirmarse mediante sus manifiestos, firma y SHA-256.

Cada liberación identifica tag, commit, build EAS, perfil, fecha y archivo.
Los artifacts de CI son evidencia; solo `release.yml` construye la entrega
distribuible después de las pruebas. No se etiqueta ni se envía una versión si
falla su validación. No se reutiliza un versionCode ya enviado a Play.

## Ramas y trazabilidad

La planeación propone GitFlow: `feature/* → develop → main`. Ambas ramas
existen. El historial revisado también contiene PR directos por HU hacia main;
no se presenta ese historial como si todos hubieran pasado por develop.
Las correcciones A4 se entregan sobre la rama funcional de HU08 para conservar
la secuencia de integración que controla el equipo. No se fusionan otras HUs
ni se cambia el tablero para aparentar el cierre de un Sprint.

Para nuevas entregas que sigan GitFlow, integrar las features aprobadas en
develop y promover el conjunto mediante PR a main. Las reglas de protección y
el check obligatorio deben verificarse antes de promoverlo. Los títulos y
descripciones deben relacionar la HU y tarea existentes; cerrar un issue es
una decisión del equipo y no una acción del pipeline.

Una corrección posterior a una liberación se prepara en `fix/*`, se prueba,
incrementa PATCH cuando corresponda y genera otra entrega identificable.
Recuperar una versión anterior requiere un commit de reversión y nueva
compilación con versionCode mayor; fallar CI no revierte un merge existente.
