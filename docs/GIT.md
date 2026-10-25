# Trazabilidad

> **Flujo vigente desde el 25 de octubre de 2026:** para completar la estructura solicitada por la rúbrica se creó `develop` a partir de `main` (`bbd004feff479ce09b022c9d9e2b0a7b5c523711`), sin reescribir commits. `feature/HU-08-evidencias-octubre` contiene la entrega acumulada y presenta sus cambios a `develop` mediante PR. El flujo a partir de esta fecha es `feature/*` / `fix/*` → PR a `develop` → PR de entrega a `main`. Los PR históricos hacia `main` se conservan como evidencia; no deben integrarse dos veces los mismos cambios. El responsable revisa el orden de integración. Crear esta rama hoy no acredita que se utilizara antes de esta fecha.
>
> Las issues, sus responsables, fechas y Sprints siguen siendo los del Project oficial. [Aportaciones comprobadas del equipo](APORTACIONES_EQUIPO_OCTUBRE.md). Las descripciones siguientes del flujo previo se conservan como historial.

> **Actualización de lectura del 23 de octubre de 2026:** se conserva la trazabilidad original de este documento. El propietario ya integró cambios en `main`; las frases históricas que indican que todos los PR permanecen sin integración no describen el estado actual. La [revisión de la rúbrica](REVISION_RUBRICA_2026-10-23.md) registra el `main` consultado, PR57 abierto, estados del Project y la diferencia respecto de la rama `develop` solicitada por el instrumento. No se cambió el flujo, los Sprints ni sus estados durante esta revisión.

La planificación oficial está en las issues y el Project existentes de Josafock/Econolab-Movil. No se crean HUs, sprints ni fechas alternativos. Se consultaron las relaciones sub-issue por API el 2026-10-05.

| HU | Issue | Sub-issues | Rama |
|---|---|---|---|
| 01 | #1 | #10 #11 #12 #13 #14; CI: #36 #37 #38 | feature/HU-01-arquitectura |
| 02 | #2 | #15 #16 #17 #18 | feature/HU-02-interfaz |
| 03 | #3 | #19 #20 #21 | feature/HU-03-autenticacion |
| 04 | #4 | #22 #23 #24 | feature/HU-04-modulos |
| 05 | #6 | #25 #26 #27 | feature/HU-05-estudios |
| 06 | #7 | #28 #29 | feature/HU-06-perfil |
| 07 | #8 | #30 #31 #32 | feature/HU-07-errores |
| 08 | #9 | #33 #34 #35 | feature/HU-08-pruebas |

#5 es PB-05 Módulos principales, no HU05. Las ramas se basan en la HU anterior cuando requieren su código. Los PR hacia main explicarán esa dependencia y el rango propio de commits; mientras las bases no se integren, su diff será acumulativo. No se fusionan ramas ni se modifica main. El responsable decide el orden según sus sprints. Conviene integrar conservando commits (merge commit) o rebasar las ramas dependientes después de un squash.

Los números TH del tablero se mantienen; los mensajes de commit emplean HU-XX/T-XX.YY y referencias a las issues reales. SemVer MAJOR.MINOR.PATCH conforme a #13. No se crean tags sprint ni se decide un cierre de sprint.

El titular habilitó `read:project` el 6 de octubre y se verificó el Project oficial número 4, «Econolab Movil»: 14 campos, 37 issues y seis Sprints. La [verificación del Project](PROJECT_VERIFICATION.md) registra fechas, responsables y estados reales, además de las 29 subtareas sin Sprint individual. No se modificó la planificación.

Las correcciones posteriores se publican en ramas `fix/HU-XX-...` y PR dependientes. El perfil completo está en `fix/HU-06-perfil-completo`, el icono nativo en `fix/HU-02-icono-aplicacion`, la verificación en `fix/HU-01-verificacion-project` y la evidencia de publicación en `fix/HU-06-publicacion-render`. La rama acumulada HU08 incorpora esos commits mediante avance de su referencia, sin merge. El PR original HU06 conserva la versión parcial histórica; PR49 añade la consulta y edición completas. El propietario autorizó integrar únicamente el PR1 del backend, cuyo perfil se verificó después en Render. Los PR y `main` del móvil permanecen sin integración.
