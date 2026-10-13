# GitHub Actions de Econolab

El workflow `Mobile CI` está en `.github/workflows/ci.yml`. Atiende las tareas
[#14](https://github.com/Josafock/Econolab-Movil/issues/14),
[#36](https://github.com/Josafock/Econolab-Movil/issues/36),
[#37](https://github.com/Josafock/Econolab-Movil/issues/37) y
[#38](https://github.com/Josafock/Econolab-Movil/issues/38).

Se ejecuta en cada push a una rama y en Pull Requests hacia `main` o `develop`.
Cuando se integre en la rama predeterminada, también se podrá ejecutar desde
**Actions → Mobile CI → Run workflow**. Actualmente no existe `develop`;
el filtro queda preparado para cuando el equipo la cree.

## Etapas y evidencias

1. **Validaciones y pruebas**: Node.js 24, `npm ci`, ESLint sin advertencias y
   TypeScript. Ejecuta `npm test -- --ci --runInBand` cuando la rama define
   el script `test` de Jest. La base inicial de `main` no lo tiene: el resumen
   de la ejecución indica esa carencia y no declara pruebas aprobadas.
2. **Build android / ios / web**: después de las validaciones, tres jobs exportan
   la aplicación con Expo 57. Una falla de exportación hace fallar su job.
3. **Artifacts**: cada build guarda su bundle durante 14 días. Se descarga al
   abrir la ejecución en Actions, sección **Artifacts**. Los bundles móviles
   contienen JavaScript y recursos; no son APK/AAB/IPA ni una instalación
   comprobada en dispositivos. El artifact web contiene la exportación estática.

Los jobs tienen límites de tiempo, caché de npm y cancelación de ejecuciones
anteriores de la misma referencia. El token del workflow solo lee código.
Estas etapas no necesitan secrets de Expo ni credenciales de producción.
Los Actions se fijan por commit. La URL `https://example.invalid/api` es un
valor público de CI para las ramas que requieren configurar la API al exportar;
los bundles de evidencia no se distribuyen como versiones conectadas a Render.

## Verificación local

```sh
npm ci
npm run lint
npm run typecheck
npm run build
```

## Integración con el trabajo existente

Las ramas `feature/HU-01-arquitectura` a `feature/HU-08-pruebas` ya contienen
versiones de `ci.yml`; `main` conserva la plantilla inicial. Al integrar esos PR,
revisar el conflicto de `ci.yml`, `package.json` y la configuración de ESLint:
conservar los scripts funcionales de cada HU y las etapas de pruebas reales.
No reemplazar el código de las HUs con la plantilla inicial.

La rama HU-08 también incluye `integration.yml` y `scripts/integration.cjs`
para pruebas reales al cierre de Sprint. Ese workflow requiere
`INTEGRATION_API_URL`, `INTEGRATION_EMAIL` e `INTEGRATION_PASSWORD` en Secrets.
Su habilitación debe acompañar la integración de ese código y la cuenta de
pruebas correspondiente; esta configuración inicial no acredita esas pruebas.
SonarCloud, distribución beta y pruebas de dispositivo requieren sus propios
proyectos, credenciales y entornos antes de incorporarlos al pipeline.

## Project y revisión

El tablero indicado es [Econolab Movil, número 4](https://github.com/users/Josafock/projects/4).
La credencial disponible para esta configuración permite administrar el repo,
pero GitHub rechazó leer el tablero por falta de `read:project`.
La documentación existente de HU-08 registra una consulta del 6 de octubre;
no se toma como una lectura actual de sus estados o Sprints.

Los checks de Actions permiten ver fallos en el PR. Para impedir merges con
fallos, el administrador debe configurar los checks obligatorios en las reglas
de rama después de integrar el workflow. Este cambio no establece reglas de
protección, no mueve tareas del Project ni cierra issues automáticamente.
