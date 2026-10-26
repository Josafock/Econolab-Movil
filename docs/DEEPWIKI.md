# Revisión de documentación y DeepWiki

Repositorio: https://github.com/Josafock/Econolab-Movil

Consulta de DeepWiki: https://deepwiki.com/Josafock/Econolab-Movil

La lectura automatizada del servicio devolvió un control de acceso HTTP 429 el
26 de octubre de 2026. Eso no confirma que el repositorio esté indexado ni que
su índice corresponda a la versión 1.1.0. La revisión del índice en el servicio
queda pendiente; no se fabrica una captura ni se atribuye autoría automática.

La documentación versionada que debe compararse con el índice cubre:

| Tema | Fuente comprobable |
|---|---|
| Arquitectura y separación de responsabilidades | `docs/ARCHITECTURE.md`, `src/core`, `src/features/studies`, `src/features/privacy` |
| Transporte, sesión, renovación y pinning | `src/core/api.ts`, módulos de autenticación y `config/pinning.json` |
| Interfaz y módulos de negocio | `src/app`, `src/ui`, `src/features` |
| Dependencias y ejecución | `package.json`, lockfile, README y `docs/DEPENDENCIES.md` |
| Pruebas y datos reproducibles | `docs/TESTING.md`, `tests`, `test`, `tests/fixtures`, scripts de seguridad |
| CI y liberación | `.github/workflows`, `eas.json`, `docs/CI_CORRECCIONES_A4.md` |
| Versionamiento y promoción | `docs/VERSIONAMIENTO.md`, `ci/release-policy.json` |

Cuando el titular solicite o actualice el índice, debe comprobar el commit
analizado y contrastar al menos arquitectura, rutas reales, comandos, pruebas y
workflows. Un índice construido desde main mientras solo contiene HU01 no
documenta todas las funciones de la rama de HU08. Conservar el enlace y la fecha
de revisión, junto con la rama o commit documentado.
