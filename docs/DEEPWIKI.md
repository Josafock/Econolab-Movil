# Revisión de documentación y DeepWiki

Repositorio: https://github.com/Josafock/Econolab-Movil

Consulta de DeepWiki: https://deepwiki.com/Josafock/Econolab-Movil

El 26 de octubre de 2026 se solicitó la indexación con autorización del titular,
quien resolvió la verificación humana del servicio. DeepWiki aceptó la solicitud.
La lectura posterior mediante el MCP oficial devolvió el índice y el contenido
de 22 páginas: visión general, aplicación móvil, sistema CI/CD, herramientas y
glosario, con subpáginas de arquitectura, API, pruebas, dependencias y workflows.

El índice publicado describe el pipeline anterior por matrices de HU y conserva
`plan.json` durante 14 días. Esos detalles coinciden con el código de `main` y
no con la corrección A4, que deriva evidencia de una regresión única y transmite
el plan como output. No debe emplearse ese índice para acreditar que las
correcciones de esta rama ya están documentadas en DeepWiki. El MCP no expuso
un SHA de indexación; no se atribuye uno sin evidencia del servicio.

`.devin/wiki.json` prepara seis páginas para una futura regeneración que incluya
la corrección A4. Esa configuración aún no formaba parte de `main` al generar
el índice. Después de la integración se debe actualizar DeepWiki y contrastar
sus referencias de código con el commit realmente integrado.

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
