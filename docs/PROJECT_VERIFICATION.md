# Verificación del Project oficial

Consulta realizada el 6 de octubre de 2026 mediante GitHub CLI y GraphQL, después de que el titular habilitó `read:project`. Se revisó el Project privado [Econolab Movil, número 4](https://github.com/users/Josafock/projects/4), de Josafock: abierto, con 37 issues y 14 campos. El Project número 3, «Econolab Mobile App», también existe, pero no es el tablero oficial indicado en la instrucción original.

## Campos existentes

Title, Assignees, Status, Labels, Linked pull requests, Milestone, Repository, Reviewers, Parent issue, Sub-issues progress, Created, Updated, Closed y Sprint.

`Status` ofrece **Product Backlog**, **Todo**, **In Progress** y **Done**. `Sprint` es un campo de iteraciones, con duración de siete días y comienzo en domingo. Las fechas siguientes proceden de su configuración; el último día se calcula como inicio más seis días.

| Sprint | Inicio | Último día |
| --- | --- | --- |
| Sprint 1 | 2026-09-27 | 2026-10-03 |
| Sprint 2 | 2026-10-04 | 2026-10-10 |
| Sprint 3 | 2026-10-11 | 2026-10-17 |
| Sprint 4 | 2026-10-18 | 2026-10-24 |
| Sprint 5 | 2026-10-25 | 2026-10-31 |
| Sprint 6 | 2026-11-01 | 2026-11-07 |

GitHub devuelve Sprint 1 en `completedIterations` por su fecha. Esto no acredita que el responsable haya cerrado el Sprint, validado todas sus tareas o publicado un tag.

## Asignaciones observadas

| HU | Issue | Sprint | Status | Assignees |
| --- | --- | --- | --- | --- |
| HU-01 | [#1](https://github.com/Josafock/Econolab-Movil/issues/1) | Sprint 1 | Done | Josafock |
| HU-02 | [#2](https://github.com/Josafock/Econolab-Movil/issues/2) | Sprint 1 | In Progress | Josafock |
| HU-03 | [#3](https://github.com/Josafock/Econolab-Movil/issues/3) | Sprint 2 | Todo | DavidHdz117 |
| HU-04 | [#4](https://github.com/Josafock/Econolab-Movil/issues/4) | Sprint 3 | Todo | Josafock |
| HU-05 | [#6](https://github.com/Josafock/Econolab-Movil/issues/6) | Sprint 4 | Todo | DavidHdz117 |
| HU-06 | [#7](https://github.com/Josafock/Econolab-Movil/issues/7) | Sprint 4 | Product Backlog | Josafock |
| HU-07 | [#8](https://github.com/Josafock/Econolab-Movil/issues/8) | Sprint 5 | Product Backlog | Josafock |
| HU-08 | [#9](https://github.com/Josafock/Econolab-Movil/issues/9) | Sprint 6 | Product Backlog | DavidHdz117 |

Las 29 subtareas, issues #10–#38, están en **Todo** y **sin valor individual de Sprint**, incluidas las tareas de CI #36–#38. El Sprint de la HU no demuestra que sus subtareas tengan el mismo valor. También se observó HU01 en Done con sus subtareas aún en Todo; corresponde al equipo revisar si esos estados reflejan su avance.

La issue #5 es PB-05 y no está entre los 37 elementos de este Project; no sustituye a #6 como HU05. La jerarquía y las ramas están en [trazabilidad Git](GIT.md).

La verificación fue de lectura: no se agregaron campos, issues, fechas, responsables, iteraciones ni tags, y no se modificaron estados. El equipo conserva el control de su planificación y del cierre de cada Sprint.
