# Aportaciones comprobables del equipo — octubre de 2026

Integrantes confirmados por el alumno: **Jesús David Saldaña Hernández**, `DavidHdz117`, y **Kristofer**, `Josafock`. La cuenta de Kristofer muestra el nombre de autor `JosafatTHz`; no se cambia la autoría histórica.

## Trabajo registrado

| Integrante | Área con evidencia real | Ejemplos verificables |
| --- | --- | --- |
| Jesús David | Arquitectura Expo y conexión a API | [bd6616b](https://github.com/Josafock/Econolab-Movil/commit/bd6616b48c5f), [PR39](https://github.com/Josafock/Econolab-Movil/pull/39), HU01 / issues 1 y 10–14. |
| Jesús David | Vistas, autenticación, catálogo, perfil y recuperación de errores | [PR40](https://github.com/Josafock/Econolab-Movil/pull/40), [PR41](https://github.com/Josafock/Econolab-Movil/pull/41), [PR43](https://github.com/Josafock/Econolab-Movil/pull/43), [PR49](https://github.com/Josafock/Econolab-Movil/pull/49), [PR45](https://github.com/Josafock/Econolab-Movil/pull/45). |
| Jesús David | Cortes por fecha y pruebas de la aplicación | [PR56](https://github.com/Josafock/Econolab-Movil/pull/56), [PR58](https://github.com/Josafock/Econolab-Movil/pull/58), [69e6386](https://github.com/Josafock/Econolab-Movil/commit/69e6386ce0b92484d8ed0fb9bf5e5697d8525a89). HU04 y HU08. |
| Jesús David | Corrección del formulario bajo el teclado Android y pruebas del desplazamiento | [e037d41](https://github.com/Josafock/Econolab-Movil/commit/e037d41bae8349c0652a83f7b8aaa7a3f7fd694e), HU02 y HU08 dentro de PR59. |
| Kristofer | Puesta en marcha de CI y generación nativa Expo | [76ffaab](https://github.com/Josafock/Econolab-Movil/commit/76ffaab835e8), [e4e46fd](https://github.com/Josafock/Econolab-Movil/commit/e4e46fddc935), [111bcd8](https://github.com/Josafock/Econolab-Movil/commit/111bcd85224c). |
| Kristofer | Validaciones por HU y distribución tras integración | [e8b335a](https://github.com/Josafock/Econolab-Movil/commit/e8b335ad2c60), [PR53](https://github.com/Josafock/Econolab-Movil/pull/53). |
| Kristofer | Control de calidad de los PR y reportes de seguimiento | [72813a4](https://github.com/Josafock/Econolab-Movil/commit/72813a453dee), [PR54](https://github.com/Josafock/Econolab-Movil/pull/54), [2bf22fa](https://github.com/Josafock/Econolab-Movil/commit/2bf22fa255bd), [PR55](https://github.com/Josafock/Econolab-Movil/pull/55). |

Ambos aportaron en áreas diferentes: implementación de producto y pruebas por un lado, automatización y controles del repositorio por el otro. Contar commits no mide por sí solo esfuerzo o calidad. No se atribuyen diseños, pruebas manuales, reuniones ni revisiones que no estén documentadas.

## Cómo comprobarlo

En GitHub, abrir los enlaces anteriores y revisar autor, fecha, archivos cambiados y resultados. En una copia del repositorio:

```powershell
git fetch origin
git log --all --no-merges --format="%h %ad %an %s" --date=short
git shortlog -sne --no-merges --all
```

La revisión del 25 de octubre encontró 67 commits sin merge de David y siete de `JosafatTHz` en las referencias consultadas, antes del commit de esta documentación. Es una fotografía del historial, no un reparto porcentual de trabajo. Los commits posteriores cambian estos números.

## Validación que corresponde al equipo

Los dos integrantes deben leer esta tabla y confirmar que representa su trabajo. La rúbrica exige aportaciones equilibradas; el docente valora el alcance de cada área y el equipo debe explicarlo. Este documento acredita que ambos tienen cambios reales, pero no certifica un reparto de horas iguales.

Para reforzar la evidencia de colaboración, Kristofer puede revisar el PR de octubre desde su propia cuenta y registrar observaciones reales; David debe resolverlas. Esa revisión se marcará como realizada únicamente cuando exista en GitHub. No se crean commits ni aprobaciones en nombre del compañero.
